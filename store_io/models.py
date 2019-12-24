from django.db import models
from django.contrib.auth.models import User


# Create your models here.
class Customer(models.Model):
    name = models.CharField(max_length=30)
    owes = models.IntegerField(default=0)


class Instalment(models.Model):
    paid_on = models.DateTimeField(blank=True, auto_now=True)
    amount_paid = models.IntegerField(blank=True, default=0)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE)


class Manufacturer(models.Model):
    name = models.CharField(max_length=100)


class Store(models.Model):
    location = models.CharField(max_length=20)
    is_warehouse = models.BooleanField(default=False)


class Product(models.Model):
    code = models.CharField(max_length=20, unique=True)
    manufacturer_code = models.CharField(max_length=20, default=None, null=True, blank=True)
    description = models.TextField()
    raw_price = models.IntegerField()
    raw_price_vat = models.FloatField(default=0)
    regular_price = models.IntegerField()
    discount = models.IntegerField(blank=True, null=True, default=0)
    discounted_price = models.IntegerField(blank=True, null=True)
    stock_source = models.CharField(max_length=100)
    manufacturer = models.ForeignKey(Manufacturer, on_delete=models.CASCADE, blank=True, null=True)


class StoreProductQuantity(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    store = models.ForeignKey(Store, on_delete=models.CASCADE, null=True, blank=True)
    available_quantity = models.IntegerField(default=0)


class Sale(models.Model):
    date_sold = models.DateTimeField(auto_now_add=True)
    total_sum = models.IntegerField(default=0)
    is_paid = models.BooleanField(default=False)
    is_completed = models.BooleanField(default=False)
    discount = models.FloatField(blank=True, null=True)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, blank=True, null=True)
    registered = models.BooleanField(default=False)
    employee = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    paid_sum = models.PositiveIntegerField(default=0)
    store = models.ForeignKey(Store, on_delete=models.CASCADE)


class CartItem(models.Model):
    product = models.ForeignKey(StoreProductQuantity, on_delete=models.CASCADE)
    bought_quantity = models.IntegerField(default=1)
    combined_price = models.FloatField()
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE)

    class Meta:
        unique_together = (('product', 'sale'),)


class Invoice(models.Model):
    invoice_number = models.CharField(max_length=20, unique=True)
    manufacturer = models.ForeignKey(Manufacturer, on_delete=models.SET_NULL, null=True)


class ProductFlow(models.Model):
    ADDITION = 'ADD'
    SUBTRACTION = 'SUB'

    WAREHOUSE = 'WH'
    MANUFACTURER = 'OEM'
    CUSTOMER = 'CUS'

    TYPE_OPERATION = (
        (ADDITION, 'ADDITION'),
        (SUBTRACTION, 'SUBTRACTION')
    )

    TYPE_FROM = (
        (WAREHOUSE, 'Магацин'),
        (MANUFACTURER, 'Добавувач'),
        (CUSTOMER, 'Муштерија')
    )

    manufacturer = models.ForeignKey(Manufacturer, on_delete=models.CASCADE, blank=True, null=True)
    store_product_from = models.ForeignKey(StoreProductQuantity, on_delete=models.CASCADE, null=True, blank=True,
                                           related_name='sp_to')
    store_product_to = models.ForeignKey(StoreProductQuantity, on_delete=models.CASCADE,
                                         related_name='sp_from')
    date = models.DateTimeField()
    operation = models.CharField(max_length=20, choices=TYPE_OPERATION, default=ADDITION)
    source = models.CharField(max_length=20, choices=TYPE_FROM, default=MANUFACTURER)
    invoice = models.ForeignKey(Invoice, on_delete=models.SET_NULL, null=True, blank=True, default=None)
    quantity = models.PositiveIntegerField(default=1)

# class Employee(models.Model):
#     user = models.OneToOneField(User, on_delete=models.CASCADE)
#     store = models.ForeignKey(Store, on_delete=models.CASCADE)
#     sale = models.OneToOneField(Sale, on_delete=models.CASCADE, blank=True, null=True, default=0)
