from guardian.shortcuts import get_perms
from rest_framework.permissions import BasePermission


class IsOwnerOrReadOnly(BasePermission):
    def has_object_permission(self, request, view, obj):
        user = request.user
        method = request.method
        perms = get_perms(user, obj)
        basename = view.basename
        if user.is_superuser:
            return True
        if method == 'DELETE':
            print('delete')
            return user.has_perm('delete_%s' % basename, obj)
        if method in ['GET', 'OPTIONS', 'HEAD']:
            print('get')
            return user.has_perm('view_%s' % basename, obj)
        if method in ['PUT', 'PATCH']:
            print('patch')
            return user.has_perm('change_%s' % basename, obj)


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_superuser
