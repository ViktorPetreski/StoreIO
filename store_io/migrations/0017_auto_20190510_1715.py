# Generated by Django 2.2 on 2019-05-10 15:15

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('store_io', '0016_auto_20190510_1631'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='customer',
            name='amount_paid',
        ),
        migrations.RemoveField(
            model_name='customer',
            name='paid_on',
        ),
        migrations.AddField(
            model_name='customer',
            name='owes',
            field=models.IntegerField(default=0),
        ),
        migrations.CreateModel(
            name='PaidSum',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('paid_on', models.DateTimeField(blank=True)),
                ('amount_paid', models.IntegerField(blank=True, default=0)),
                ('customer', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='store_io.Customer')),
            ],
        ),
    ]
