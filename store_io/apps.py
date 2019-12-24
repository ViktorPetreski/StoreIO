from django.apps import AppConfig


class StoreIoConfig(AppConfig):
    name = 'store_io'

    def ready(self):
        import store_io .signals