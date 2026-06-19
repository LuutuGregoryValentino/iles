from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('iles_models_app.urls', namespace='api')),
]# This is the main URL configuration for the Django project. It includes the admin interface and routes API requests to the `iles_models_app` application. The `namespace='api'` allows for namespacing of URL patterns within the `iles_models_app`.

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
# This line is used to serve media files during development. In production, you would typically serve media files using a web server like Nginx or Apache.