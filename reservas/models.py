from abc import ABC, abstractmethod
import uuid
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from recursos.models import Aeronave, DisponibilidadInstructor, Habilitacion


class EstadoReserva(models.TextChoices):
    CONFIRMADA = 'CONFIRMADA', 'Confirmada'
    CANCELADA = 'CANCELADA', 'Cancelada'


class Reserva(models.Model):
    """Entidad principal que representa un vuelo de instrucción."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    creador = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='reservas_creadas',
    )
    alumno = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='reservas_alumno',
    )
    instructor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='reservas_instructor',
    )
    aeronave = models.ForeignKey(
        Aeronave, on_delete=models.PROTECT, related_name='reservas'
    )

    estado = models.CharField(
        max_length=20,
        choices=EstadoReserva.choices,
        default=EstadoReserva.CONFIRMADA,
    )
    inicio = models.DateTimeField()
    fin = models.DateTimeField()
    observacion = models.TextField(max_length=500, blank=True, null=True)
    recordatorio = models.BooleanField(default=False)
    clave_solicitud = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        help_text='Clave para garantizar idempotencia',
    )

    def duracion(self):
        return self.fin - self.inicio

    def __str__(self):
        return f'Reserva {self.id} | {self.alumno} con {self.instructor} en {self.aeronave.matricula}'


class Ocupacion(models.Model):
    """Garantiza la no superposición de horarios para personas o aeronaves."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reserva = models.ForeignKey(
        Reserva,
        on_delete=models.CASCADE,
        related_name='ocupaciones',
        null=True,
        blank=True,
    )
    bloqueo = models.ForeignKey(
        'recursos.Bloqueo',
        on_delete=models.CASCADE,
        related_name='ocupaciones',
        null=True,
        blank=True,
    )

    # Puede ser el ID de un Usuario o de una Aeronave (RecursoAgenda)
    recurso_id = models.CharField(max_length=64)
    inicio = models.DateTimeField()
    fin = models.DateTimeField()
    activa = models.BooleanField(default=True)

    def solapa(self, otra_ocupacion):
        return self.activa and (
            self.inicio < otra_ocupacion.fin
            and otra_ocupacion.inicio < self.fin
        )

    def clean(self):
        if self.inicio >= self.fin:
            raise ValidationError('La hora de inicio debe ser menor al fin.')

        # Restricción XOR (Proviene de una Reserva o de un Bloqueo, no ambos ni ninguno)
        if not (self.reserva_id or self.bloqueo_id) or (
            self.reserva_id and self.bloqueo_id
        ):
            raise ValidationError(
                'La ocupación debe pertenecer exclusivamente a una Reserva o a un Bloqueo.'
            )

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=(
                    models.Q(reserva__isnull=False, bloqueo__isnull=True)
                    | models.Q(reserva__isnull=True, bloqueo__isnull=False)
                ),
                name='ocupacion_un_unico_origen',
            ),
            models.CheckConstraint(
                condition=models.Q(inicio__lt=models.F('fin')),
                name='ocupacion_inicio_antes_fin',
            ),
        ]


# ==========================================
# PATRÓN DESIGN: STRATEGY PARA VALIDACIÓN
# ==========================================


class PoliticaReserva(ABC):

    @abstractmethod
    def validar(self, solicitante, alumno, instructor, aeronave, inicio, fin):
        pass


class PoliticaAlumno(PoliticaReserva):

    def validar(self, solicitante, alumno, instructor, aeronave, inicio, fin):
        # RN05: El alumno solo reserva para sí mismo
        if solicitante != alumno:
            raise ValidationError(
                'Un alumno solo puede crear reservas para sí mismo.'
            )
        PoliticaBase.validar_reglas_comunes(
            alumno, instructor, aeronave, inicio, fin
        )


class PoliticaAdministrativa(PoliticaReserva):

    def validar(self, solicitante, alumno, instructor, aeronave, inicio, fin):
        # RN05: Administrador o Instructor pueden crear reservas para cualquier alumno
        if solicitante.rol not in ['ADMIN', 'INSTRUCTOR'] and not solicitante.is_superuser:
            raise ValidationError(
                'No posee permisos administrativos para agendar a otros usuarios.'
            )
        PoliticaBase.validar_reglas_comunes(
            alumno, instructor, aeronave, inicio, fin
        )


class PoliticaBase:

    @staticmethod
    def validar_reglas_comunes(alumno, instructor, aeronave, inicio, fin):
        if inicio >= fin:
            raise ValidationError('La hora de inicio debe ser menor al fin.')

        if alumno == instructor:
            raise ValidationError(
                'El alumno y el instructor deben ser usuarios distintos.'
            )

        # Habilitación vigente del instructor para el modelo de la aeronave
        hab_inst = Habilitacion.objects.filter(
            usuario=instructor,
            modelo=aeronave.modelo,
            vigente_hasta__gte=fin,
        ).exists()
        if not hab_inst:
            raise ValidationError(
                f'El instructor {instructor} no posee habilitación vigente para el modelo {aeronave.modelo}.'
            )

        # Disponibilidad declarada del instructor
        disp = DisponibilidadInstructor.objects.filter(
            instructor=instructor, inicio__lte=inicio, fin__gte=fin
        ).exists()
        if not disp:
            raise ValidationError(
                f'El instructor {instructor} no tiene disponibilidad declarada para todo el bloque horario.'
            )