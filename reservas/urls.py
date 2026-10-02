from django.urls import path

from . import views

urlpatterns = [
    path('', views.crear_reserva_view, name='crear-reserva'),
    path(
        '<uuid:reserva_id>/cancelar/',
        views.cancelar_reserva_view,
        name='cancelar-reserva',
    ),
]