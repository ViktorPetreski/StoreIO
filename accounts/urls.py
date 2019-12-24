from django.urls import path, include
from knox import views as knox_views

from accounts.views import RegistrationAPI, LoginAPI, UserAPI

urlpatterns = [
    path('', include('knox.urls')),
    path('/register', RegistrationAPI.as_view()),
    path('/login', LoginAPI.as_view()),
    path('/user', UserAPI.as_view()),
    path('/logout', knox_views.LogoutView.as_view(), name='knox_logout')
]
