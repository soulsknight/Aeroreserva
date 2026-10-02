from django.contrib.auth.models import AbstractUser
from django.db import models


class Usuario(AbstractUser):
    """Modelo de usuario personalizado para el sistema AeroReserva.

    Soporta los perfiles de Alumno, Instructor y Administrador.
    """

    class Rol(models.TextChoices):
        ALUMNO = 'ALUMNO', 'Alumno'
        INSTRUCTOR = 'INSTRUCTOR', 'Instructor'
        ADMINISTRADOR = 'ADMIN', 'Administrador'

    rol = models.CharField(
        max_length=15,
        choices=Rol.choices,
        default=Rol.ALUMNO,
        help_text='Rol del usuario en el sistema',
    )
    telefono = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        help_text='Teléfono de contacto',
    )

    def __str__(self):
        return (
            f'{self.get_full_name() or self.username} ({self.get_rol_display()})'
        )

    @property
    def es_alumno(self):
        return self.rol == self.Rol.ALUMNO

    @property
    def es_instructor(self):
        return self.rol == self.Rol.INSTRUCTOR

    @property
    def es_administrador(self):
        return self.rol == self.Rol.ADMINISTRADOR or self.is_superuser