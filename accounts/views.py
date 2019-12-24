from django.shortcuts import render
from django.contrib.auth.models import Group
# Create your views here.
from knox.models import AuthToken
from rest_framework import generics, permissions
from rest_framework.response import Response

from accounts.serializers import RegisterSerializer, UserSerializer, LoginSerializer
from store_io.models import Store


class RegistrationAPI(generics.GenericAPIView):
    serializer_class = RegisterSerializer

    def post(self, request, *args, **kwargs):
        store_id = request.data.pop('store')
        store = Store.objects.get(pk=store_id)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        group, created = Group.objects.get_or_create(name=store.location)
        user.groups.add(group)
        return Response({
            "user": UserSerializer(user, context=self.get_serializer_context()).data,
            "token": AuthToken.objects.create(user)
        })


class LoginAPI(generics.GenericAPIView):
    serializer_class = LoginSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data
        return Response({
            "user": UserSerializer(user, context=self.get_serializer_context()).data,
            "token": AuthToken.objects.create(user)
        })


class UserAPI(generics.RetrieveAPIView):
    permission_classes = [
        permissions.IsAuthenticated,
    ]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user
