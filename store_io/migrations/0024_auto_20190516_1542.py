# Generated by Django 2.2 on 2019-05-16 13:42

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('store_io', '0023_auto_20190515_1944'),
    ]

    operations = [
        migrations.RenameModel(
            old_name='PaidSum',
            new_name='Instalment',
        ),
    ]
