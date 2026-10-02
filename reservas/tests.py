from django.test import TestCase
# Create your tests here.

from datetime import timedelta

from django.core.exceptions import ValidationError
from django.utils import timezone

from cuentas.models import Usuario
from recursos.models import Aeronave, DisponibilidadInstructor, Habilitacion

from .models import EstadoReserva, Ocupacion
from .services import cancelar_reserva, crear_reserva


class ReservaServiceTests(TestCase):
	def setUp(self):
		self.alumno = Usuario.objects.create_user(
			username='alumno', rol=Usuario.Rol.ALUMNO
		)
		self.instructor = Usuario.objects.create_user(
			username='instructor', rol=Usuario.Rol.INSTRUCTOR
		)
		self.administrador = Usuario.objects.create_user(
			username='admin', rol=Usuario.Rol.ADMINISTRADOR
		)
		self.aeronave = Aeronave.objects.create(
			matricula='CC-TEST', modelo='Cessna 172'
		)
		self.inicio = timezone.now() + timedelta(days=1)
		self.fin = self.inicio + timedelta(hours=2)
		Habilitacion.objects.create(
			usuario=self.instructor,
			modelo=self.aeronave.modelo,
			tipo='MONOMOTOR',
			vigente_hasta=self.fin + timedelta(days=1),
		)
		DisponibilidadInstructor.objects.create(
			instructor=self.instructor,
			inicio=self.inicio - timedelta(hours=1),
			fin=self.fin + timedelta(hours=1),
		)

	def test_crea_reserva_y_ocupaciones_para_tres_recursos(self):
		reserva = crear_reserva(
			self.alumno,
			self.alumno,
			self.instructor,
			self.aeronave,
			self.inicio,
			self.fin,
		)

		self.assertEqual(reserva.estado, EstadoReserva.CONFIRMADA)
		self.assertEqual(reserva.ocupaciones.count(), 3)

	def test_rechaza_solapamiento(self):
		crear_reserva(
			self.alumno,
			self.alumno,
			self.instructor,
			self.aeronave,
			self.inicio,
			self.fin,
		)

		with self.assertRaises(ValidationError):
			crear_reserva(
				self.administrador,
				self.alumno,
				self.instructor,
				self.aeronave,
				self.inicio + timedelta(minutes=30),
				self.fin + timedelta(minutes=30),
			)

	def test_clave_idempotente_no_duplica_reserva(self):
		clave = '6f0f6e65-1b40-47c0-a6cb-bf5932b72b5e'
		primera = crear_reserva(
			self.alumno,
			self.alumno,
			self.instructor,
			self.aeronave,
			self.inicio,
			self.fin,
			clave_solicitud=clave,
		)
		segunda = crear_reserva(
			self.alumno,
			self.alumno,
			self.instructor,
			self.aeronave,
			self.inicio,
			self.fin,
			clave_solicitud=clave,
		)

		self.assertEqual(primera.pk, segunda.pk)
		self.assertEqual(self.alumno.reservas_creadas.count(), 1)

	def test_cancelar_desactiva_ocupaciones(self):
		reserva = crear_reserva(
			self.alumno,
			self.alumno,
			self.instructor,
			self.aeronave,
			self.inicio,
			self.fin,
		)

		cancelar_reserva(reserva, self.alumno, 'Cambio de horario')

		reserva.refresh_from_db()
		self.assertEqual(reserva.estado, EstadoReserva.CANCELADA)
		self.assertFalse(Ocupacion.objects.filter(reserva=reserva, activa=True).exists())

# Create your tests here.
