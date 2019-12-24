from django.dispatch import receiver
from django.db.models.signals import post_save, post_delete
from guardian.shortcuts import assign_perm, remove_perm

from store_io.models import Sale, ProductFlow, Invoice


@receiver(post_save, sender=Sale, dispatch_uid="sale_assign_permission")
def permission_assign(sender, instance, created, **kwargs):
    if created:
        user = instance.employee
        user_groups = user.groups.all()
        for group in user_groups:
            assign_perm('StoreIO.view_sale', group, instance)
            assign_perm('StoreIO.add_sale', group, instance)
            assign_perm('StoreIO.change_sale', group, instance)
