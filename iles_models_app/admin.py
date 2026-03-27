from django.contrib import admin
from .models import (
    student, 
    internship_administrator, 
    workplace_supervisor, 
    academic_supervisor, 
    internship_placement, 
    logbook_entry, 
    evaluation
)

# This makes your models visible in the Admin panel
admin.site.register(student)
admin.site.register(internship_administrator)
admin.site.register(workplace_supervisor)
admin.site.register(academic_supervisor)
admin.site.register(internship_placement)
admin.site.register(logbook_entry)
admin.site.register(evaluation)


