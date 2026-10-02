import json

from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_POST


@ensure_csrf_cookie
@require_GET
def csrf_token_view(request):
	return JsonResponse({'csrfToken': get_token(request)})


@require_POST
def login_view(request):
	try:
		payload = json.loads(request.body or '{}')
	except json.JSONDecodeError:
		payload = {}

	user = authenticate(
		request,
		username=payload.get('username', ''),
		password=payload.get('password', ''),
	)
	if user is None or not user.is_active:
		return JsonResponse({'error': 'Credenciales inválidas.'}, status=401)

	login(request, user)
	return JsonResponse({'id': user.pk, 'username': user.username, 'rol': user.rol})


@require_POST
def logout_view(request):
	logout(request)
	return JsonResponse({'detail': 'Sesión cerrada.'})
