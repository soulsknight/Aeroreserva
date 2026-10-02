import uuid
from django.conf import settings
from django.db import models


class Auditoria(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    entidad = models.CharField(max_length=50)
    entidad_id = models.CharField(max_length=100)
    accion = models.CharField(max_length=50)
    motivo = models.TextField(null=True, blank=True)
    valores_anteriores = models.JSONField(null=True, blank=True)
    valores_nuevos = models.JSONField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Auditorías'

    def __str__(self):
        return f'[{self.timestamp}] {self.accion} en {self.entidad} por {self.usuario}'