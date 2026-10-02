import uuid
from django.conf import settings
from django.db import models

class RecursoAgenda(models.Model):
    # Clase base astracta para identificar elementos agendables (Aeronaves o Usuarios).

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    activo = models.BooleanField(default=True)

    class Meta:
        abstract = True

class Aeronave(RecursoAgenda):
    # Representa una aeronave del club aéreo.

    matricula = models.CharField(
        max_length=20, unique=True, help_text='Ejemplo: CC-KAA'
    )
    modelo = models.CharField(
        max_length=50, help_text='Ejemplo: Cessna 172, Piper PA-28'
    )

    def __str__(self):
        return f'{self.matricula} ({self.modelo})'

class TipoHabilitacion(models.TextChoices):
    MONOMOTOR = 'MONOMOTOR', 'Monomotor Terrestre'
    MULTIMOTOR = 'MULTIMOTOR', 'Multimotor Terrestre'
    INSTRUMENTAL = 'INSTRUMENTAL', 'Vuelo por Instrumentos (IFR)'

class Habilitacion(models.Model):
    # Habilitaciones internas autorizadas por la administración para alumnos e instructores.

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='habilitaciones',
    )
    tipo = models.CharField(max_length=20, choices=TipoHabilitacion.choices)
    modelo = models.CharField(
        max_length=50, help_text='Modelo de nave autorizado'
    )
    vigente_hasta = models.DateTimeField(
        help_text='Fecha y hora hasta la cual es válida la habilitación'
    )

    def __str__(self):
        return f'{self.usuario.get_full_name() or self.usuario.username} - {self.modelo} ({self.tipo})'

class Bloqueo(models.Model):
    # Inoperatividad programada de una aeronave (ej: Mantenimiento).

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    aeronave = models.ForeignKey(
        Aeronave, on_delete=models.CASCADE, related_name='bloqueos'        
    )
    motivo = models.TextField(
        help_text='Razón del bloqueo (ej: Mantenimiento de 100 horas)'
    )
    inicio = models.DateTimeField()
    fin = models.DateTimeField()
    activo = models.BooleanField(default=True)

    def __str__(self):
        return ( f'Bloqueo {self.aeronave.matricula}: {self.inicio} a {self.fin}')

class DisponibilidadInstructor(models.Model):
    # Bloques de horarios declarados por un instructor para realizar vuelos.

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    instructor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='disponibles',
    )
    inicio = models.DateTimeField()
    fin = models.DateTimeField()

    def __str__(self):
        return f'Disponibilidad {self.instructor.get_full_name() or self.instructor.username}: {self.inicio} a {self.fin}'
