# Generated by Django 2.2 on 2019-05-21 14:01

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('store_io', '0028_auto_20190519_1919'),
    ]

    operations = [
        migrations.AddField(
            model_name='sale',
            name='store',
            field=models.ForeignKey(default=1, on_delete=django.db.models.deletion.CASCADE, to='store_io.Store'),
            preserve_default=False,
        ),
    ]
