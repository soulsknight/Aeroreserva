# AeroReserva

Sistema de reservas de vuelos de instrucción con Django y React: agenda, control de disponibilidad de aeronaves, roles de usuario y auditoría de operaciones.

## Descripción

AeroReserva es un sistema web para gestionar la agenda de vuelos de instrucción de una escuela de aviación. Permite crear y cancelar reservas evitando solapamientos de alumnos, instructores y aeronaves, aplica políticas distintas según el rol del usuario (Alumno, Instructor, Administrador), envía recordatorios previos al vuelo y mantiene un registro de auditoría de todas las acciones.

- **Backend:** Django (PostgreSQL en producción, SQLite para desarrollo/pruebas)
- **Frontend:** React + Vite

## Estructura del proyecto

- `aero_reserva_backend/`: configuración principal del proyecto Django.
- `cuentas/`: usuarios, perfiles (Alumno, Instructor, Administrador) y autenticación.
- `recursos/`: aeronaves, habilitaciones internas, bloqueos y disponibilidad.
- `reservas/`: agenda, creación/reprogramación/cancelación de reservas.
- `notificaciones/`: programación y gestión de recordatorios previos al vuelo.
- `auditoria/`: registro histórico de cambios, acciones y trazabilidad.
- `frontend/`: aplicación React/Vite que consume la API de Django.

## Ejecución local

### Backend (Django)

```sh
python -m venv venv
source venv/bin/activate
pip install django psycopg2-binary
DJANGO_DB_ENGINE=sqlite DJANGO_SECRET_KEY=dev-key DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1 \
  DJANGO_CSRF_TRUSTED_ORIGINS=http://127.0.0.1:5173,http://localhost:5173 \
  python manage.py migrate
DJANGO_DB_ENGINE=sqlite DJANGO_SECRET_KEY=dev-key DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1 \
  DJANGO_CSRF_TRUSTED_ORIGINS=http://127.0.0.1:5173,http://localhost:5173 \
  python manage.py runserver 127.0.0.1:8000
```

### Frontend (Vite)

```sh
cd frontend
npm install
npm run dev
```

Para que el frontend consuma la API real de Django, crea `frontend/.env.local` con:

```
VITE_USE_API=true
```

El servidor de desarrollo de Vite expone la app en `http://127.0.0.1:5173/` y reenvía las rutas `/auth` y `/reservas` al backend Django en `http://127.0.0.1:8000`.
