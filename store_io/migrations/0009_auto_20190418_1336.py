# Generated by Django 2.2 on 2019-04-18 11:36

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('store_io', '0008_auto_20190418_1319'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='product',
            name='store',
        ),
        migrations.AddField(
            model_name='store',
            name='products',
            field=models.ManyToManyField(blank=True, null=True, to='store_io.Product'),
        ),
    ]
