import uuid
from django.db import models


class Recordatorio(models.Model):
    # Aviso interno asociado a una reserva.

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reserva = models.ForeignKey(
        'reservas.Reserva',
        on_delete=models.CASCADE,
        related_name='recordatorios',
    )
    fecha_programada = models.DateTimeField()
    enviado = models.BooleanField(default=False)
    creado_en = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Recordatorio para Reserva {self.reserva.id} - Envio: {self.fecha_programada}'

