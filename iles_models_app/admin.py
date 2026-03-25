from django.contrib import admin
from .models import logbook_entry, student, workplace_supervisor, internship_administrator

#This makes your models visible in the Admin panel
admin.site.register(student)
admin.site.register(workplace_supervisor)
admin.site.register(internship_administrator)
admin.site.register(logbook_entry)


