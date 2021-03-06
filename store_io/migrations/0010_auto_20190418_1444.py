# Generated by Django 2.2 on 2019-04-18 12:44

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('store_io', '0009_auto_20190418_1336'),
    ]

    operations = [
        migrations.CreateModel(
            name='StoreProductQuantity',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('available_quantity', models.IntegerField(default=0)),
            ],
        ),
        migrations.CreateModel(
            name='WarehouseProductQuantity',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('available_quantity', models.IntegerField(default=0)),
            ],
        ),
        migrations.RemoveField(
            model_name='product',
            name='available_quantity',
        ),
        migrations.RemoveField(
            model_name='product',
            name='warehouse',
        ),
        migrations.RemoveField(
            model_name='productflow',
            name='product',
        ),
        migrations.RemoveField(
            model_name='store',
            name='products',
        ),
        migrations.AlterField(
            model_name='cartitem',
            name='product',
            field=models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, to='store_io.StoreProductQuantity'),
        ),
        migrations.AlterField(
            model_name='productflow',
            name='store',
            field=models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, to='store_io.StoreProductQuantity'),
        ),
        migrations.AlterField(
            model_name='productflow',
            name='warehouse',
            field=models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='store_io.WarehouseProductQuantity'),
        ),
        migrations.AddField(
            model_name='warehouseproductquantity',
            name='product',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='store_io.Product'),
        ),
        migrations.AddField(
            model_name='warehouseproductquantity',
            name='warehouse',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='store_io.Warehouse'),
        ),
        migrations.AddField(
            model_name='storeproductquantity',
            name='product',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='store_io.Product'),
        ),
        migrations.AddField(
            model_name='storeproductquantity',
            name='store',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='store_io.Store'),
        ),
    ]
