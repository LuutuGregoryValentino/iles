from django.contrib import admin
<<<<<<< rahmas_models
from .models import (student,internship_administrator,workplace_supervisor,academic_supervisor,internship_placement,logbook_entry,evaluation)
admin.site.register(student)
admin.site.register(internship_administrator)
admin.site.register(workplace_supervisor)
admin.site.register(academic_supervisor)
admin.site.register(internship_placement)
admin.site.register(logbook_entry)
admin.site.register(evaluation)
# Register your models here.
=======
from .models import logbook_entry, student, workplace_supervisor, internship_administrator

#This makes your models visible in the Admin panel
admin.site.register(student)
admin.site.register(workplace_supervisor)
admin.site.register(internship_administrator)
admin.site.register(logbook_entry)


>>>>>>> main
