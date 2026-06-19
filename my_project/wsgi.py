import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'my_project.settings')
application = get_wsgi_application()
# This file is used for deploying the Django application on platforms like Render or Heroku. For local development, you can use the default runserver command.