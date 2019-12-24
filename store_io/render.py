import datetime
import os
from django.conf import settings
from django.http import HttpResponse
from django.template import Context
from django.template.loader import get_template
from xhtml2pdf import pisa
from io import BytesIO

from StoreIO import settings


class Render:

    @staticmethod
    def link_callback(uri, rel):
        """
        Convert HTML URIs to absolute system paths so xhtml2pdf can access those
        resources
        """
        # use short variable names
        sUrl = settings.STATIC_URL  # Typically /static/
        sRoot = settings.STATIC_ROOT  # Typically /home/userX/project_static/
        # convert URIs to absolute system paths
        if uri.startswith(sUrl):
            path = os.path.join(sRoot, uri.replace(sUrl, "").replace("/", "\\"))
        else:
            return uri  # handle absolute uri (ie: http://some.tld/foo.png)

        # make sure that file exists
        if not os.path.isfile(path):
            raise Exception(
                'media URI must start with ' + sUrl
            )
        return path

    @staticmethod
    def render(path: str, params: dict):
        template = get_template(path)
        html = template.render(params)
        response = BytesIO()
        # create a pdf
        pdf = pisa.CreatePDF(BytesIO(html.encode("UTF-8")), response, link_callback=Render.link_callback)
        if pdf.err:
            return HttpResponse('We had some errors <pre>' + html + '</pre>')
        return HttpResponse(response.getvalue(), content_type='application/pdf')

    @staticmethod
    def render_to_file(path: str, params: dict):
        template = get_template(path)
        html = template.render(params)
        file_name = "report-{0}.pdf".format(datetime.datetime.now().strftime('%d-%m-%Y'))
        file_path = os.path.join(os.path.abspath(os.path.dirname("__file__")), "static\\store", file_name)
        with open(file_path, 'wb') as pdf:
            pisa.pisaDocument(BytesIO(html.encode("UTF-8")), pdf, link_callback=Render.link_callback)
        return [file_name, file_path]
