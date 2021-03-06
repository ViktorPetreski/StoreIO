# Generated by Django 2.2 on 2019-05-30 16:12

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('store_io', '0029_sale_store'),
    ]

    operations = [
        migrations.CreateModel(
            name='Email',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('content', models.FileField(upload_to='uploads/')),
                ('date', models.DateField(auto_now_add=True)),
                ('recipient', models.EmailField(default='marjantriko@hotmail.com', max_length=254)),
                ('store', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='store_io.Store')),
            ],
        ),
        migrations.RemoveField(
            model_name='warehouseproductquantity',
            name='product',
        ),
        migrations.RemoveField(
            model_name='warehouseproductquantity',
            name='warehouse',
        ),
        migrations.AlterField(
            model_name='product',
            name='stock_source',
            field=models.CharField(max_length=100),
        ),
        migrations.DeleteModel(
            name='Warehouse',
        ),
        migrations.DeleteModel(
            name='WarehouseProductQuantity',
        ),
    ]
