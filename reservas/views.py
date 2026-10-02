import json
from datetime import datetime

from django.contrib.auth.decorators import login_required
from django.core.exceptions import ValidationError
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.views.decorators.http import require_POST

from cuentas.models import Usuario
from recursos.models import Aeronave

from .models import Reserva
from .services import cancelar_reserva, crear_reserva


def _mensaje_error(error):
	if isinstance(error, ValidationError):
		return '; '.join(error.messages)
	return str(error)


def _fecha_desde_payload(valor):
	fecha = datetime.fromisoformat(valor.replace('Z', '+00:00'))
	if timezone.is_naive(fecha):
		fecha = timezone.make_aware(fecha)
	return fecha


@login_required
@require_POST
def crear_reserva_view(request):
	try:
		payload = json.loads(request.body)
		reserva = crear_reserva(
			solicitante=request.user,
			alumno=get_object_or_404(Usuario, pk=payload['alumno_id']),
			instructor=get_object_or_404(Usuario, pk=payload['instructor_id']),
			aeronave=get_object_or_404(Aeronave, pk=payload['aeronave_id']),
			inicio=_fecha_desde_payload(payload['inicio']),
			fin=_fecha_desde_payload(payload['fin']),
			observacion=payload.get('observacion', ''),
			recordatorio=payload.get('recordatorio', False),
			clave_solicitud=payload.get('clave_solicitud'),
		)
	except (KeyError, TypeError, ValueError, ValidationError) as error:
		return JsonResponse({'error': _mensaje_error(error)}, status=400)

	return JsonResponse({'id': str(reserva.id), 'estado': reserva.estado}, status=201)


@login_required
@require_POST
def cancelar_reserva_view(request, reserva_id):
	reserva = get_object_or_404(Reserva, pk=reserva_id)
	try:
		payload = json.loads(request.body or '{}')
		cancelar_reserva(
			reserva=reserva,
			solicitante=request.user,
			motivo=payload.get('motivo', ''),
		)
	except (TypeError, ValueError, ValidationError) as error:
		return JsonResponse({'error': _mensaje_error(error)}, status=400)

	return JsonResponse({'id': str(reserva.id), 'estado': reserva.estado})
