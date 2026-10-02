from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Usuario


@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    # Campos visibles en la lista de usuarios
    list_display = (
        'username',
        'email',
        'first_name',
        'last_name',
        'rol',
        'is_staff',
    )
    list_filter = ('rol', 'is_staff', 'is_active')

    # Agregar el campo 'rol' y 'telefono' al formulario de edicion de django Admin
    fieldsets = UserAdmin.fieldsets + (
        (
            'Información de AeroReserva',
            {
                'fields': ('rol', 'telefono'),
            },
        ),
    )

    add_fieldsets = UserAdmin.add_fieldsets + (
        (
            'Información de AeroReserva',
            {
            'fields': ('rol', 'telefono'),
            },
        ),
    )