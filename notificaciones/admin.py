from django.contrib import admin
from .models import Recordatorio

@admin.register(Recordatorio)
class RecordatorioAdmin(admin.ModelAdmin):
    list_display = ('reserva', 'fecha_programada', 'enviado', 'creado_en')
    list_filter = ('enviado',)
