from collections import OrderedDict

from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class SalePagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

    def get_paginated_response(self, data):
        total_sum = data.pop('total_sum')
        cash_sum = data.pop('cash_sum')
        registered_sum = data.pop('registered_sum')
        return Response(OrderedDict([
            ('count', self.page.paginator.count),
            ('next', self.get_next_link()),
            ('previous', self.get_previous_link()),
            ('total_sum', total_sum),
            ('cash_sum', cash_sum),
            ('registered_sum', registered_sum),
            ('results', data['carts'])
        ]))


class ProductFlowPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100
