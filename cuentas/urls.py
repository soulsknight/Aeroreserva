from django.urls import path

from .views import csrf_token_view, login_view, logout_view

urlpatterns = [
    path('csrf/', csrf_token_view, name='csrf-token'),
    path('login/', login_view, name='login'),
    path('logout/', logout_view, name='logout'),
]