from django.contrib import admin
from .models import Ocupacion, Reserva


@admin.register(Reserva)
class ReservaAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'alumno',
        'instructor',
        'aeronave',
        'inicio',
        'fin',
        'estado',
    )
    list_filter = ('estado', 'aeronave')
    search_fields = (
        'alumno__username',
        'instructor__username',
        'aeronave__matricula',
    )


@admin.register(Ocupacion)
class OcupacionAdmin(admin.ModelAdmin):
    list_display = ('recurso_id', 'inicio', 'fin', 'activa', 'reserva')
    list_filter = ('activa',)