from datetime import timedelta
import uuid

from auditoria.services import AuditoriaService
from django.core.exceptions import ValidationError
from django.db import transaction

from notificaciones.models import Recordatorio

from .models import (
	EstadoReserva,
	Ocupacion,
	PoliticaAdministrativa,
	PoliticaAlumno,
	Reserva,
)


def _recurso_usuario(usuario):
	return f'usuario:{usuario.pk}'


def _recurso_aeronave(aeronave):
	return f'aeronave:{aeronave.pk}'


def _validar_solapamientos(inicio, fin, recursos, reserva_id=None):
	ocupaciones = Ocupacion.objects.filter(
		activa=True,
		recurso_id__in=recursos,
		inicio__lt=fin,
		fin__gt=inicio,
	)
	if reserva_id:
		ocupaciones = ocupaciones.exclude(reserva_id=reserva_id)
	if ocupaciones.exists():
		raise ValidationError('Uno de los recursos ya está ocupado en ese horario.')


@transaction.atomic
def crear_reserva(
	solicitante,
	alumno,
	instructor,
	aeronave,
	inicio,
	fin,
	observacion='',
	recordatorio=False,
	clave_solicitud=None,
):
	clave_solicitud = clave_solicitud or uuid.uuid4()
	if clave_solicitud:
		existente = Reserva.objects.filter(clave_solicitud=clave_solicitud).first()
		if existente:
			return existente

	if not aeronave.activo:
		raise ValidationError('La aeronave no está activa.')

	if solicitante.rol == solicitante.Rol.ALUMNO:
		PoliticaAlumno().validar(
			solicitante, alumno, instructor, aeronave, inicio, fin
		)
	else:
		PoliticaAdministrativa().validar(
			solicitante, alumno, instructor, aeronave, inicio, fin
		)

	recursos = {
		_recurso_usuario(alumno),
		_recurso_usuario(instructor),
		_recurso_aeronave(aeronave),
	}
	_validar_solapamientos(inicio, fin, recursos)

	reserva = Reserva.objects.create(
		creador=solicitante,
		alumno=alumno,
		instructor=instructor,
		aeronave=aeronave,
		inicio=inicio,
		fin=fin,
		observacion=observacion,
		recordatorio=recordatorio,
		clave_solicitud=clave_solicitud,
	)
	Ocupacion.objects.bulk_create(
		[
			Ocupacion(
				reserva=reserva,
				recurso_id=recurso,
				inicio=inicio,
				fin=fin,
			)
			for recurso in recursos
		]
	)
	if recordatorio:
		Recordatorio.objects.create(
			reserva=reserva,
			fecha_programada=inicio - timedelta(minutes=30),
		)
	AuditoriaService.registrar(
		usuario=solicitante,
		entidad='Reserva',
		entidad_id=reserva.id,
		accion='CREACION',
		valores_nuevos={
			'inicio': inicio.isoformat(),
			'fin': fin.isoformat(),
			'alumno_id': alumno.pk,
			'instructor_id': instructor.pk,
			'aeronave_id': str(aeronave.pk),
		},
	)
	return reserva


@transaction.atomic
def cancelar_reserva(reserva, solicitante, motivo=''):
	puede_cancelar = (
		solicitante == reserva.creador
		or solicitante.is_superuser
		or solicitante.rol in [solicitante.Rol.ADMINISTRADOR, solicitante.Rol.INSTRUCTOR]
	)
	if not puede_cancelar:
		raise ValidationError('No posee permisos para cancelar esta reserva.')
	if reserva.estado == EstadoReserva.CANCELADA:
		return reserva

	reserva.estado = EstadoReserva.CANCELADA
	reserva.save(update_fields=['estado'])
	reserva.ocupaciones.filter(activa=True).update(activa=False)
	AuditoriaService.registrar(
		usuario=solicitante,
		entidad='Reserva',
		entidad_id=reserva.id,
		accion='CANCELACION',
		motivo=motivo,
	)
	return reserva