# Generated by Django 2.2 on 2019-05-07 13:29

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('store_io', '0011_product_code'),
    ]

    operations = [
        migrations.AlterField(
            model_name='product',
            name='code',
            field=models.CharField(max_length=20, unique=True),
        ),
    ]
