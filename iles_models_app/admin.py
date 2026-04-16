
from django.contrib import admin
from .models import *

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'course', 'year')
    search_fields = ('user__username',)

@admin.register(InternshipPlacement)
class InternshipPlacementAdmin(admin.ModelAdmin):
    list_display = ('student', 'company_name', 'start_date')

@admin.register(LogbookEntry)
class LogbookEntryAdmin(admin.ModelAdmin):
    list_display = ('student', 'date', 'status')

@admin.register(Issue)
class IssueAdmin(admin.ModelAdmin):
    list_display = ('student', 'title', 'status')

admin.site.register(User)
admin.site.register(InternshipAdministrator)
admin.site.register(WorkplaceSupervisor)
admin.site.register(Evaluation)
admin.site.register(Project)
admin.site.register(UserProfile) 



