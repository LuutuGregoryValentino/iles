from django.contrib import admin
from .models import(User,Student,InternshipAdministrator,WorkplaceSupervisor,InternshipPlacement,LogbookEntry,Evaluation,Issue)

admin.site.register(User)
admin.site.register(Student)
admin.site.register(InternshipAdministrator)
admin.site.register(WorkplaceSupervisor)
admin.site.register(InternshipPlacement)
admin.site.register(LogbookEntry)
admin.site.register(Evaluation)
admin.site.register(Issue)
admin.site.register(Project)
admin.site.register(UserProfile)



