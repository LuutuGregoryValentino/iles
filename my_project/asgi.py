import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'my_project.settings')
application = get_asgi_application()
# This file is used for deploying the Django application on platforms like Render or Heroku. For local development, you can use the default runserver command.