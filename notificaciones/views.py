from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from .models import Auditoria


@login_required
def consultar_historial(request):
    usuario = request.user

    # Permisos según el Informe Técnico:
    # Alumno ve historial propio; Administrador e Instructor ven historial global
    if usuario.rol in ['ADMINISTRADOR', 'INSTRUCTOR']:
        auditorias = Auditoria.objects.all().order_by('-timestamp')
    else:
        auditorias = Auditoria.objects.filter(usuario=usuario).order_by(
            '-timestamp'
        )

    return render(
        request, 'notificaciones/historial.html', {'auditorias': auditorias}
    )