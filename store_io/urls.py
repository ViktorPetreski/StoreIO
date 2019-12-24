from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import *



router = DefaultRouter()
router.register('stores', StoreViewSet, base_name='store')
router.register('manufacturer', ManufacturerViewSet, base_name='manufacturer')
router.register('products', ProductViewSet, base_name='product')
router.register('customers', CustomerViewSet, base_name='customer')
router.register('checkout', SaleViewSet, base_name='sale')
router.register('cart-items', CartItemViewSet, base_name='cartitem')
router.register('product-flow', ProductFlowViewSet, base_name='productflow')
router.register('store-products', StoreProductQuantityViewSet, base_name='storeproduct')
router.register('instalments', InstalmentViewSet, base_name='instalment')
router.register('generate-report', EmailViewSet, base_name='email')
router.register('invoices', InvoiceViewSet, base_name='invoice')
router.register('dashboard', Dashboard, base_name='dashboard')

urlpatterns = router.urls
