# Generated by Django 2.2 on 2019-05-10 14:31

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('store_io', '0015_auto_20190510_1551'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='sale',
            name='products',
        ),
        migrations.AddField(
            model_name='cartitem',
            name='sale',
            field=models.ForeignKey(default=0, on_delete=django.db.models.deletion.CASCADE, to='store_io.Sale'),
            preserve_default=False,
        ),
    ]
