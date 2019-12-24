import copy
import datetime
import math
import random
import pandas as pd
from operator import itemgetter
from threading import Thread

from background_task.models import Task
from collections import OrderedDict

from django.contrib.auth.models import Group
from django.core.exceptions import ObjectDoesNotExist
from django.core.mail import EmailMessage
from django.db.models import Sum, Count, F
from guardian.shortcuts import assign_perm, remove_perm
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.filters import OrderingFilter
from rest_framework_guardian import filters

from StoreIO import settings
from store_io.pagination import SalePagination, ProductFlowPagination
from store_io.permissions import IsOwnerOrReadOnly, IsAdmin
from store_io.render import Render
from store_io.tasks import remove_uncompleted_carts
from .serializers import *
from .models import *
from rest_framework.response import Response


def prepare_data(queryset):
    result_list = []
    for pf in queryset:
        product = pf.store_product_to.product
        info_from = pf.store_product_from.store.location if pf.store_product_from else pf.manufacturer.name
        data_object = OrderedDict([
            ("key", pf.id),
            ("product", product.description),
            ("price", product.discounted_price if product.discounted_price else product.regular_price),
            ("info_to", pf.store_product_to.store.location),
            ("info_from", info_from),
            ("date", pf.date),
            ("quantity", pf.quantity),
            ("operation", pf.operation),
            ("invoice_number", pf.invoice.invoice_number if pf.invoice else None),
            ("invoice_id", pf.invoice.id if pf.invoice else None),
        ])
        result_list.append(data_object)
    return result_list


def remove_permission(model_name, instance, groups):
    for group in groups:
        remove_perm('StoreIO.view_%s' % model_name, group, instance)
        remove_perm('StoreIO.add_%s' % model_name, group, instance)
        remove_perm('StoreIO.change_%s' % model_name, group, instance)
    # adding permissions to operate on the product flow object to the source transaction store
    if instance.manufacturer is None:
        other_user_groups = Group.objects.get(name=instance.store_product_from.store.location)
        remove_perm('StoreIO.view_%s' % model_name, other_user_groups, instance)
        remove_perm('StoreIO.add_%s' % model_name, other_user_groups, instance)
        remove_perm('StoreIO.change_%s' % model_name, other_user_groups, instance)


class ProductFlowViewSet(viewsets.ModelViewSet):
    permission_classes = [
        permissions.IsAuthenticated,
        IsOwnerOrReadOnly,
    ]
    serializer_class = ProductFlowSerializer
    pagination_class = ProductFlowPagination
    queryset = ProductFlow.objects.all()
    filter_backends = (filters.DjangoObjectPermissionsFilter, OrderingFilter)
    ordering_fields = ('date', 'store_product_to')
    ordering = ('date',)

    @action(methods=['get'], detail=False)
    def task(self, request):
        t = datetime.datetime.now().replace(hour=20, minute=30)
        remove_uncompleted_carts(repeat=Task.DAILY, schedule=t)
        return Response(status=status.HTTP_302_FOUND)

    def create(self, request, *args, **kwargs):
        new_quantity = request.data['new_quantity']
        user_group = self.request.user.groups.all()[0]
        store = Store.objects.get(location=user_group.name)

        operation = ProductFlow.ADDITION if request.data['operation'] else ProductFlow.SUBTRACTION
        temp_quantity = new_quantity
        if operation is ProductFlow.SUBTRACTION:
            temp_quantity = new_quantity * -1

        source = request.data['stock_source']
        date = request.data['date']
        from_store = request.data['source'] if source == ProductFlow.WAREHOUSE else None
        from_manufacturer = request.data['source'] if source == ProductFlow.MANUFACTURER else None
        product = Product.objects.get(pk=request.data['product_id'])
        store_product, created = StoreProductQuantity.objects.get_or_create(product=product, store=store)
        source_store_product_serializer = None
        from_stock_product = None
        if from_store:
            from_stock_product = StoreProductQuantity.objects.get(store=from_store, product=product)
            from_stock_product.available_quantity -= temp_quantity
            from_stock_product.save()
            source_store_product_serializer = StoreProductQuantitySerializer(from_stock_product)

        store_product.available_quantity += temp_quantity
        store_product.save()
        restocked_store_product_serializer = StoreProductQuantitySerializer(store_product)
        invoice = request.data.get('invoiceNumber')
        product_flow = {
            'quantity': new_quantity,
            'store_product_to': store_product.id,
            'store_product_from': from_stock_product.id if from_stock_product else None,
            'source': source,
            'operation': operation,
            'date': date,
            'manufacturer': from_manufacturer,
            'invoice': invoice,
        }
        serializer = self.get_serializer(data=product_flow)
        serializer.is_valid(raise_exception=True)
        product_flow_object = self.perform_create(serializer)

        return_data = {
            'restocked_store_product': restocked_store_product_serializer.data,
            'source_store_product': source_store_product_serializer.data if from_stock_product else None,
            'product_flow': prepare_data([product_flow_object, ])
        }
        return Response(return_data, status=status.HTTP_201_CREATED)

    def perform_create(self, serializer):
        product_flow = serializer.save()
        user_groups = self.request.user.groups.all()
        for group in user_groups:
            assign_perm('StoreIO.view_productflow', group, product_flow)
            assign_perm('StoreIO.add_productflow', group, product_flow)
            assign_perm('StoreIO.change_productflow', group, product_flow)
        # adding permissions to operate on the product flow object to the source transaction store
        if product_flow.manufacturer is None:
            other_user_groups = Group.objects.get(name=product_flow.store_product_from.store.location)
            assign_perm('StoreIO.view_productflow', other_user_groups, product_flow)
            assign_perm('StoreIO.add_productflow', other_user_groups, product_flow)
            assign_perm('StoreIO.change_productflow', other_user_groups, product_flow)
        return product_flow

    def list(self, request, *args, **kwargs):
        date = request.query_params.get('date', None)
        invoice_id = request.query_params.get('invoice', None)
        product_flows = self.filter_queryset(self.get_queryset())
        if invoice_id is None:
            if date == '':
                now = datetime.datetime.now()
                month = now.month
                year = now.year
            else:
                date_parts = date.split('-')
                month = date_parts[0]
                year = date_parts[1]
            product_flows = product_flows.filter(date__month=month, date__year=year).select_related(
                'store_product_to__store').select_related('store_product_from__store').select_related(
                'manufacturer').select_related('store_product_to__product').select_related('invoice')
        else:
            print(invoice_id)
            product_flows = product_flows.filter(invoice=invoice_id).select_related(
                'store_product_to__store').select_related('store_product_from__store').select_related(
                'manufacturer').select_related('store_product_to__product').select_related('invoice')

        page = self.paginate_queryset(product_flows)
        if page is not None:
            return self.get_paginated_response(prepare_data(page))
        return Response(prepare_data(product_flows), status=status.HTTP_200_OK)

    def perform_destroy(self, instance):
        user_groups = self.request.user.groups.all()
        remove_permission('productflow', instance, user_groups)
        instance.delete()


class InstalmentViewSet(viewsets.ModelViewSet):
    permission_classes = [
        permissions.IsAuthenticated,
    ]
    serializer_class = InstalmentSerializer
    queryset = Instalment.objects.all()
    filter_backends = (filters.DjangoObjectPermissionsFilter,)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        customer = Customer.objects.get(pk=request.data['customer'])
        amount_paid = int(request.data['amount_paid'])
        customer.owes -= amount_paid
        customer.save()
        sales = Sale.objects.filter(customer=customer.id, is_paid=False).order_by('date_sold')
        sale = None
        for sale in sales:
            amount_owed = sale.total_sum - sale.paid_sum
            if amount_owed > amount_paid:
                sale.paid_sum += amount_paid
                sale.save()
                break
            if amount_owed <= amount_paid:
                sale.paid_sum = sale.total_sum
                amount_paid -= amount_owed
                sale.is_paid = True
                sale.save()

        return Response({
            'instalment': serializer.data,
            'customer': CustomerSerializer(customer).data,
            'cart': SaleSerializer(sale).data
        }, status=status.HTTP_201_CREATED)


class CustomerViewSet(viewsets.ModelViewSet):
    permission_classes = [
        permissions.IsAuthenticated,
        IsOwnerOrReadOnly,
    ]
    serializer_class = CustomerSerializer
    queryset = Customer.objects.all()
    filter_backends = (filters.DjangoObjectPermissionsFilter,)

    def perform_create(self, serializer):
        user_groups = self.request.user.groups.all()
        customer = serializer.save()
        for group in user_groups:
            assign_perm('StoreIO.view_customer', group, customer)
            assign_perm('StoreIO.add_customer', group, customer)
            assign_perm('StoreIO.change_customer', group, customer)


class CartItemViewSet(viewsets.ModelViewSet):
    permission_classes = [
        permissions.IsAuthenticated,
        IsOwnerOrReadOnly,
    ]
    serializer_class = CartItemSerializer
    queryset = CartItem.objects.all()
    filter_backends = (filters.DjangoObjectPermissionsFilter,)

    def create(self, request, *args, **kwargs):
        bought_quantity = request.data['bought_quantity']
        regular_price = request.data['regular_price']
        discount_price = request.data['discounted_price']
        store_product_id = request.data['id']
        price = discount_price if discount_price else regular_price
        combined_price = price * bought_quantity
        store_product = StoreProductQuantity.objects.get(pk=store_product_id)
        store_product.available_quantity -= bought_quantity
        store_product.save()
        user_groups = self.request.user.groups.all()
        store = Store.objects.get(location=user_groups[0].name)
        sp_serializer = StoreProductQuantitySerializer(store_product)
        cart, created = Sale.objects.get_or_create(is_completed=False, employee=request.user, store=store)
        cart_item = {'product': store_product_id, 'bought_quantity': bought_quantity, 'combined_price': combined_price,
                     'sale': cart.id}
        serializer = self.get_serializer(data=cart_item)
        try:
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
        except ValidationError as ex:
            ci = CartItem.objects.get(sale=cart.id, product=store_product_id)
            ci.bought_quantity += bought_quantity
            ci.combined_price = ci.bought_quantity * price
            ci.save()
            serializer = self.get_serializer(instance=ci)
        headers = self.get_success_headers(serializer.data)
        return_data = {'cartItem': serializer.data, 'store_product': sp_serializer.data,
                       'cart': SaleSerializer(cart).data}
        return Response(return_data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        cart_item = serializer.save()
        user_groups = self.request.user.groups.all()
        for group in user_groups:
            assign_perm('StoreIO.view_cartitem', group, cart_item)
            assign_perm('StoreIO.add_cartitem', group, cart_item)
            assign_perm('StoreIO.delete_cartitem', group, cart_item)
            assign_perm('StoreIO.change_cartitem', group, cart_item)

    def list(self, request, *args, **kwargs):
        customer = request.query_params.get('customer', None)
        date = request.query_params.get('day', None)
        store_id = request.query_params.get('store', None)
        queryset = self.filter_queryset(self.get_queryset())
        store = None
        cart_items = None
        try:
            store = Store.objects.get(pk=store_id)
            cart, created = Sale.objects.get_or_create(is_completed=False, employee=request.user, store=store)
            cart_items = queryset.filter(sale=cart.id)
        except ObjectDoesNotExist:
            pass
        if customer is not None:
            cart_items = queryset.filter(sale__customer=customer)
        if date is not None:
            date_ = datetime.datetime.strptime(date, '%d-%m-%Y')
            date_end = date_ + datetime.timedelta(hours=24)
            cart_items = queryset.filter(sale__date_sold__gte=date_,
                                         sale__date_sold__lte=date_end,
                                         sale__store=store, sale__is_completed=True)
        serializer = self.get_serializer(cart_items, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        store_product_id = request.data.pop('store_product')
        store_product = StoreProductQuantity.objects.select_related('product').get(pk=store_product_id)
        instance = self.get_object()
        old_bought_quantity = instance.bought_quantity
        new_bought_quantity = request.data.get('bought_quantity')
        price = store_product.product.discounted_price if \
            store_product.product.discounted_price else store_product.product.regular_price
        instance.combined_price = new_bought_quantity * price
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        related_cart_items_sum = CartItem.objects.filter(sale=instance.sale).aggregate(Sum('combined_price'))
        sale = instance.sale
        sale.total_sum = related_cart_items_sum['combined_price__sum']
        sale.save()
        difference = new_bought_quantity - old_bought_quantity
        store_product.available_quantity -= difference
        store_product.save()
        headers = self.get_success_headers(serializer.data)
        return Response({'cart_item': serializer.data, 'cart': SaleSerializer(sale).data}, status=status.HTTP_200_OK,
                        headers=headers)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        store_product = StoreProductQuantity.objects.get(pk=instance.product.id)
        store_product.available_quantity += instance.bought_quantity
        store_product.save()
        sp_serializer = StoreProductQuantitySerializer(store_product)
        self.perform_destroy(instance)
        return Response(sp_serializer.data, status=status.HTTP_200_OK)


class SaleViewSet(viewsets.ModelViewSet):
    permission_classes = (
        permissions.IsAuthenticated,
        IsOwnerOrReadOnly,
    )
    serializer_class = SaleSerializer
    pagination_class = SalePagination
    queryset = Sale.objects.all()
    filter_backends = (filters.DjangoObjectPermissionsFilter, OrderingFilter)
    ordering_fields = ('date_sold', 'store')
    ordering = ('date_sold',)

    def list(self, request, *args, **kwargs):
        user_group = self.request.user.groups.all()
        # store = Store.objects.get(location=user_group[0].name)
        queryset = self.filter_queryset(self.get_queryset())

        customer = request.query_params.get('customer', None)
        date = request.query_params.get('day', None)
        store = request.query_params.get('store', None)
        if customer is not None:
            cart = queryset.filter(customer=customer).order_by('date_sold')
            page = self.paginate_queryset(cart)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            serializer = self.get_serializer(cart, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        if date is not None:
            date_ = datetime.datetime.strptime(date, '%d-%m-%Y')
            date_end = date_ + datetime.timedelta(hours=24)
            cart = queryset.filter(date_sold__gte=date_, date_sold__lte=date_end,
                                   is_completed=True, store=store)
            cash_total = cart.filter(registered=False).aggregate(Sum('total_sum'))
            cash_total = {'total_sum__sum': 0} if cash_total['total_sum__sum'] is None else cash_total
            registered_total = cart.filter(registered=True).aggregate(Sum('total_sum'))
            registered_total = {'total_sum__sum': 0} if registered_total['total_sum__sum'] is None else registered_total
            return_data = {
                'total_sum': cash_total['total_sum__sum'] + registered_total['total_sum__sum'],
                'cash_sum': cash_total['total_sum__sum'],
                'registered_sum': registered_total['total_sum__sum'],
            }
            page = self.paginate_queryset(cart)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return_data['carts'] = serializer.data
                return self.get_paginated_response(return_data)
            serializer = self.get_serializer(cart, many=True)
            return_data['carts'] = serializer.data
            headers = self.get_success_headers(serializer.data)

            return Response(return_data, status=status.HTTP_200_OK, headers=headers)
        cart, created = queryset.get(is_completed=False, employee=request.user, store=store)
        serializer = self.get_serializer(instance=cart)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_200_OK, headers=headers)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        customer_id = request.data.get('customer')
        if customer_id:
            customer = Customer.objects.get(pk=customer_id)
            customer.owes += request.data.get('total_sum')
            customer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    def perform_update(self, serializer):
        customer = self.request.data.get('customer')
        total_sum = self.request.data.get('total_sum')
        serializer.save(is_paid=False if customer else True, is_completed=True, paid_sum=0 if customer else total_sum)

    def perform_destroy(self, instance):
        user_group = self.request.user.groups.all()
        for g in user_group:
            remove_perm('add_sale', g, instance)
            remove_perm('change_sale', g, instance)
            remove_perm('view_sale', g, instance)


class ManufacturerViewSet(viewsets.ModelViewSet):
    serializer_class = ManufacturerSerializer
    queryset = Manufacturer.objects.all()
    permission_classes = (permissions.IsAuthenticated,)


class ProductViewSet(viewsets.ModelViewSet):
    permission_classes = [
        permissions.IsAuthenticated,
    ]
    serializer_class = ProductSerializer
    queryset = Product.objects.all()

    def update(self, request, *args, **kwargs):
        request.data.pop('available_quantity')
        request.data.pop('product')
        request.data.pop('store')
        request.data.pop('key')
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data)
        serializer.is_valid(raise_exception=True)
        disc_number = int(request.data['discount'])
        if disc_number != 0:
            regular_price = request.data['regular_price']
            discount = disc_number / 100
            discounted_price = round(int(regular_price) * (1 - discount))
            serializer.save(discounted_price=discounted_price)
        elif instance.discount != 0 and disc_number == 0:
            serializer.save(discounted_price=None)
        else:
            serializer.save()
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_200_OK, headers=headers)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        store_products = StoreProductQuantity.objects.filter(product=instance.id)
        for sp in store_products:
            sp.delete()
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)


class StoreViewSet(viewsets.ModelViewSet):
    serializer_class = StoreSerializer
    queryset = Store.objects.all()

    def list(self, request, *args, **kwargs):
        warehouses = request.query_params.get('warehouses', None)
        data = self.get_queryset()
        if warehouses is not None:
            data = self.get_queryset().filter(is_warehouse=True)
        serializer = self.get_serializer(data, many=True)
        return_data = {'all_stores': serializer.data}
        user_group = request.user.groups.all()[0]
        store = self.filter_queryset(self.get_queryset()).get(location=user_group.name)
        serializer = self.get_serializer(store)
        return_data['current_store'] = serializer.data
        return Response(return_data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def get_current_store(self, request, *args, **kwargs):
        user_group = request.user.groups.all()[0]
        store = self.filter_queryset(self.get_queryset()).get(location=user_group.name)
        serializer = self.get_serializer(store)
        return Response(serializer.data, status=status.HTTP_200_OK)


class StoreProductQuantityViewSet(viewsets.ModelViewSet):
    permission_classes = [
        permissions.IsAuthenticated,
    ]
    serializer_class = StoreProductQuantitySerializer
    queryset = StoreProductQuantity.objects.all()
    filter_backends = (filters.DjangoObjectPermissionsFilter,)

    def create(self, request, *args, **kwargs):
        available_quantity = request.data.pop('available_quantity')
        serializer = ProductSerializer(data=request.data)
        user_group = self.request.user.groups.all()[0]
        store = Store.objects.get(location=user_group.name)
        try:
            serializer.is_valid(raise_exception=True)
            product = serializer.save()
            data = {'product': product.id, 'store': store.id, 'available_quantity': available_quantity}
            store_product_serializer = self.get_serializer(data=data)
            store_product_serializer.is_valid(raise_exception=True)
            self.perform_create(store_product_serializer)
            headers = self.get_success_headers(serializer.data)
            return_data = {'mainProduct': serializer.data, 'storeProduct': store_product_serializer.data}
            # return Response(return_data, status=status.HTTP_201_CREATED, headers=headers)
        except ValidationError as ex:
            template = "An exception of type {0} occurred. Arguments:\n{1!r}"
            message = template.format(type(ex).__name__, ex.args)
            code = request.data.pop('code')
            # print(message)
            product = Product.objects.get(code=code)
            try:
                StoreProductQuantity.objects.get(store=store.id, product=product.id)
                raise ValidationError('Продуктот постои во продавницата. Ажурирајте преку соодветното мени')
            except ObjectDoesNotExist:
                pass
            data = {'product': product.id, 'store': store.id, 'available_quantity': available_quantity}
            store_product_serializer = self.get_serializer(data=data)
            store_product_serializer.is_valid(raise_exception=True)
            self.perform_create(store_product_serializer)
            headers = self.get_success_headers(store_product_serializer.data)
            return_data = {'mainProduct': None, 'storeProduct': store_product_serializer.data}
        return Response(return_data, status=status.HTTP_201_CREATED, headers=headers)

    def list(self, request, *args, **kwargs):
        store_products = self.get_queryset()
        user_group = self.request.user.groups.all()[0]
        store = Store.objects.get(location=user_group.name)
        current_store_products = filter(lambda p: p.store.id == store.id, store_products)
        all_serializer = self.get_serializer(store_products, many=True)
        current_serializer = self.get_serializer(current_store_products, many=True)
        return_data = {'allStoreProducts': all_serializer.data, 'currentStoreProducts': current_serializer.data}
        return Response(return_data, status=status.HTTP_200_OK)

    @action(methods=['get'], detail=False)
    def get_quantities_for_other_stores(self, request):
        product_id = request.query_params.get('product', None)
        store_products = self.get_queryset().filter(product=product_id)
        serializer = self.get_serializer(store_products, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class EmailViewSet(viewsets.ModelViewSet):

    def list(self, request, *args, **kwargs):
        today = datetime.date.today()
        sales = Sale.objects.filter(date_sold__gte=today).order_by('-store')
        cart_items = CartItem.objects.filter(sale__date_sold__gte=today).order_by('-sale__store')
        tmp = []
        stores = Store.objects.filter(is_warehouse=False)
        for store in stores:
            quantity_lte_10 = StoreProductQuantity.objects.filter(store=store.id, available_quantity__lte=5)
            cart_items_for_store = cart_items.filter(sale__store=store.id)
            sales_for_store = sales.filter(store=store.id)
            cash_total = sales_for_store.filter(registered=False).aggregate(Sum('total_sum'))
            cash_total = {'total_sum__sum': 0} if cash_total['total_sum__sum'] is None else cash_total
            registered_total = sales_for_store.filter(registered=True).aggregate(Sum('total_sum'))
            registered_total = {'total_sum__sum': 0} if registered_total['total_sum__sum'] is None else registered_total
            data_object = {
                'total_sum': cash_total['total_sum__sum'] + registered_total['total_sum__sum'],
                'cash_sum': cash_total['total_sum__sum'],
                'registered_sum': registered_total['total_sum__sum'],
                'sales': sales_for_store,
                'products': cart_items_for_store,
                'low_quantity': quantity_lte_10,
                'location': store.location,
            }
            tmp.append(data_object)
        params = {
            'today': today,
            'data': tmp,
            'request': request
        }
        send_email = request.query_params.get('email', None)
        if send_email is not None:
            file = Render.render_to_file('pdf.html', params)
            email = EmailMessage(
                'TEST: Дневен извештај за промет во дуќаните',
                'Во прилог е прикачен денешниот извештај',
                settings.EMAIL_HOST_USER,
                ['vpetreski96@gmail.com', ],
            )
            with open(file[1], "rb") as pdf:
                email.attach(file[0], pdf.read(), 'application/pdf')
                thread = Thread(target=email.send, args=())
                thread.start()
            return Response({'message': 'successful'}, status=status.HTTP_201_CREATED)
        return Render.render('pdf.html', params)


class InvoiceViewSet(viewsets.ModelViewSet):
    permission_classes = [
        permissions.IsAuthenticated,
        IsOwnerOrReadOnly,
    ]
    serializer_class = InvoiceSerializer
    queryset = Invoice.objects.all()
    filter_backends = (filters.DjangoObjectPermissionsFilter,)

    def perform_create(self, serializer):
        instance = serializer.save()
        user_group = self.request.user.groups.all()
        for g in user_group:
            assign_perm('add_invoice', g, instance)
            assign_perm('view_invoice', g, instance)

    def perform_destroy(self, instance):
        product_flows = ProductFlow.objects.filter(invoice=instance.id)
        user_groups = self.request.user.groups.all()
        for pf in product_flows:
            pf.delete()
            remove_permission('productflow', user_groups, pf)
        remove_permission('invoice', user_groups, instance)
        instance.delete()


class Dashboard(viewsets.ModelViewSet):
    permission_classes = (permissions.IsAuthenticated, IsAdmin)

    def list(self, request, *args, **kwargs):
        today = datetime.date.today()
        current_month = today.month
        current_year = today.year
        previous_month = current_month - 1 if current_month > 1 else 12
        previous_year = current_year if current_month > 1 else current_year - 1
        top_products_count = request.query_params.get('monthlyTopCount', 20)
        bottom_products_bought = request.query_params.get('lowestMonthlyBought', 5)
        current_month_cart_items = CartItem.objects.filter(sale__date_sold__month=current_month,
                                                           sale__date_sold__year=current_year).select_related(
            'product__product')
        current_month_sold_quantity = current_month_cart_items.values(p_id=F('product__product'),
                                                                      desc=F('product__product__description'),
                                                                      loc=F('product__store__location')).annotate(
            count=Sum('bought_quantity'))
        lowest_monthly_sold_products = current_month_sold_quantity.filter(count__lte=bottom_products_bought)
        top_products_sold = current_month_sold_quantity.order_by('-count')[:top_products_count]
        previous_month_cart_items = CartItem.objects.filter(sale__date_sold__month=previous_month,
                                                            sale__date_sold__year=previous_year)

        current_month_revenue = current_month_cart_items.aggregate(total=Sum('sale__total_sum'))
        previous_month_revenue = previous_month_cart_items.aggregate(total=Sum('sale__total_sum'))
        annual_revenue = CartItem.objects.aggregate(total=Sum('sale__total_sum'))

        revenue_object = {
            'current': current_month_revenue['total'],
            'previous': previous_month_revenue['total'],
            'annual': annual_revenue['total'],
        }

        data = {}
        locations = set()
        for p in sorted(top_products_sold, key=itemgetter('desc')):
            desc = p['desc']
            count = p['count']
            loc = p['loc']
            locations.add(desc)
            if loc not in data:
                data[loc] = {
                    'data': [count, ],
                }
            else:
                data[loc]['data'].append(count)

        results = []
        for k, v in data.items():
            color = generate_color()
            bcg_color = '{}0.3)'.format(color)
            border_color = '{}1)'.format(color)
            results.append({
                'label': k,
                **v,
                'backgroundColor': bcg_color,
                'borderColor': border_color,
                'borderWidth': 1,
            })

        highest_revenue_products = current_month_cart_items.values(p_desc=F('product__product__description')).annotate(total=Sum('combined_price')).order_by('-total')[:10]
        hrp_data = {'datasets':[{'data': [], 'backgroundColor':[]}], 'labels': []}
        total_sum = 0
        for hr in highest_revenue_products:
            total = hr['total']
            total_sum += total
            p_desc = hr['p_desc']
            color = generate_color()
            bcg_color = '{}0.7)'.format(color)
            hrp_data['datasets'][0]['data'].append(total)
            hrp_data['datasets'][0]['backgroundColor'].append(bcg_color)
            hrp_data['labels'].append(p_desc)
        hrp_data['datasets'][0]['data'].append(current_month_revenue['total'] - total_sum)
        hrp_data['labels'].append('Останато')
        return Response(
            {
                'data': {
                    'datasets': results,
                    'labels': list(sorted(locations)),
                },
                'revenue': revenue_object,
                'highest_revenue_products': hrp_data
            })


    @action(methods=['get'], detail=False, url_path="sales-frequency")
    def sales_frequency(self, request):
        today = datetime.date.today()
        current_month = today.month
        current_year = today.year
        previous_month = current_month - 1 if current_month > 1 else 12
        previous_year = current_year if current_month > 1 else current_year - 1
        sales_frequency = Sale.objects.filter(date_sold__month=current_month, date_sold__year=current_year).extra(
            {'hour': 'strftime("%%H", date_sold)'}).order_by('hour').values('hour', loc=F('store__location')).annotate(
            count=Count('id'))

        data = {}
        none_list = [None for i in range(8, 24)]
        for sf in sales_frequency:
            location = sf['loc']
            count = sf['count']
            hour = int(sf['hour'])
            if location not in data:
                data[location] = {
                    'data': copy.deepcopy(none_list),
                }
                data[location]['data'].insert(hour - 8, count)
            else:
                data[location]['data'].insert(hour - 8, count)

        results = []
        hours = ["{:02d}".format(i) for i in range(8, 24)]

        for k, v in data.items():
            color = generate_color()
            border_color = '{}1)'.format(color)
            results.append({
                'label': k,
                **v,
                'borderColor': border_color,
                'borderWidth': 3,
                'fill': 'false',
            })
        # return Response(sales_frequency)

        return Response({
            'datasets': results,
            'labels': hours,
        })

    @action(methods=['get'], detail=False, url_path="product-flows-frequency")
    def product_flows_frequency(self, request):
        today = datetime.date.today()
        current_month = today.month
        current_year = today.year
        monthly_product_flow = ProductFlow.objects.filter(date__month=current_month, date__year=current_year,
                                                          operation=ProductFlow.ADDITION).extra(
            {'week': '((strftime("%%d",date)- strftime("%%w",date) - 2)/7)+2'}).values('week', loc=F('store_product_to__store__location')).annotate(
            count=Count('id'))
        data = {}
        none_list = [None for i in range(0, 4)]
        for sf in monthly_product_flow:
            location = sf['loc']
            count = sf['count']
            week = int(sf['week'])
            if location not in data:
                data[location] = {
                    'data': copy.deepcopy(none_list),
                }
                data[location]['data'].insert(week-1, count)
            else:
                data[location]['data'].insert(week-1, count)

        results = []
        weeks = [i for i in range(1,6)]

        for k, v in data.items():
            color = generate_color()
            border_color = '{}1)'.format(color)
            results.append({
                'label': k,
                **v,
                'borderColor': border_color,
                'borderWidth': 3,
                'fill': 'false',
            })
        return Response({
            'datasets': results,
            'labels': weeks,
        })

    @action(methods=['get'], detail=False, url_path="annual-income")
    def annual_revenue_vs_spending(self, request):
        today = datetime.date.today()
        week_start = request.query_params.get('start', None)
        week_end = request.query_params.get('end', None)
        year_half = request.query_params.get('half', None)
        current_year = today.year
        if week_end is None:
            year_start = '{}-01-01T00:00:00'.format(current_year)
            year_end = '{}-12-31T00:00:00'.format(current_year)
            if year_half == 'first':
                year_end = '{}-06-30T00:00:00'.format(current_year)
            if year_half == 'second':
                year_start = '{}-07-01T00:00:00'.format(current_year)
            product_flows = ProductFlow.objects.filter(
                date__range=(year_start, year_end), operation=ProductFlow.ADDITION, source=ProductFlow.MANUFACTURER).extra(
                {'month': 'strftime("%%W",date)'}).order_by('month').values(
                'month', loc=F('store_product_to__store__location')).annotate(p_price=Sum('quantity') * F('store_product_to__product__raw_price'))
            sales = Sale.objects.filter(date_sold__range=(year_start, year_end)).extra(
                {'month': 'strftime("%%W",date_sold)'}).order_by('month').values(
                'month', loc=F('store__location')).annotate(sales_total=Sum('total_sum'))
            months = pd.date_range(year_start, year_end, freq='W-MON').tolist()
            none_list = [None] * len(months)
        else:
            product_flows = ProductFlow.objects.filter(
                date__range=(week_start, week_end), operation=ProductFlow.ADDITION, source=ProductFlow.MANUFACTURER).extra(
                {'month': 'strftime("%%w",date)'}).order_by('month').values(
                'month', loc=F('store_product_to__store__location')).annotate(
                p_price=Sum('quantity') * F('store_product_to__product__raw_price'))
            sales = Sale.objects.extra(
                {'month': 'strftime("%%w",date_sold)'}).order_by('month').values(
                'month', loc=F('store__location')).annotate(sales_total=Sum('total_sum'))
            months = pd.date_range(week_start, week_end, freq='D').tolist()[:-1]
            none_list = [None] * 7
        data = {}
        for pf in product_flows:
            location = "{}-набавки".format(pf['loc'])
            count = pf['p_price']
            month = int(pf['month']) - 1
            if location not in data:
                 data[location] = {
                        'data': copy.deepcopy(none_list),
                    }
                 data[location]['data'].insert(month, count)
            else:
                if data[location]['data'][month]:
                    data[location]['data'][month] += count
                else:
                    data[location]['data'].insert(month, count)
        for sale in sales:
            location = "{}-продажби".format(sale['loc'])
            count = sale['sales_total']
            month = int(sale['month']) - 1
            if location not in data:
                data[location] = {
                    'data': copy.deepcopy(none_list),
                }
                data[location]['data'].insert(month, count)
            else:
                data[location]['data'].insert(month, count)
        results = []
        counter = 0
        for k, v in data.items():
            color = generate_color()
            border_color = '{}1)'.format(color)
            results.append({
                'label': k,
                **v,
                'borderColor': border_color,
                'borderWidth': 3,
                'fill': 'false',
            })
            counter += 1
        return Response({
            'datasets': results,
            'labels': months,
        })
        # return Response({product_flows, sales})


def generate_color():
    return 'rgba({0},{1},{2},'.format(random.randint(0, 256), random.randint(0, 256), random.randint(0, 256))
