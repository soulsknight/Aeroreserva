from django.contrib import admin
from .models import Aeronave, Bloqueo, DisponibilidadInstructor, Habilitacion

@admin.register(Aeronave)
class AeronaveAdmin(admin.ModelAdmin):
    list_display = ('matricula', 'modelo', 'activo')
    list_filter = ('activo',)
    search_fields = ('matricula', 'modelo')

@admin.register(Habilitacion)
class HabilitacionAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'tipo', 'modelo', 'vigente_hasta')
    list_filter = ('tipo', 'modelo')
    search_fields = (
        'usuario__username',
        'usuario__first_name',
        'usuario__last_name',
    )

@admin.register(Bloqueo)
class BloqueoAdmin(admin.ModelAdmin):
    list_display = ('aeronave', 'motivo', 'inicio', 'fin', 'activo')
    list_filter = ('activo', 'aeronave')

@admin.register(DisponibilidadInstructor)
class DisponibilidadInstructorAdmin(admin.ModelAdmin):
    list_display = ('instructor', 'inicio', 'fin')
    search_fields = (
        'instructor__username',
        'instructor__first_name',
        'instructor__last_name'
    )