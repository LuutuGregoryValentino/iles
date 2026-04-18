from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    User, Student, InternshipAdministrator,
    WorkplaceSupervisor, AcademicSupervisor,
    InternshipPlacement, LogbookEntry, Evaluation, Issue
)


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display  = ['email', 'username', 'role', 'university_id', 'is_active']
    list_filter   = ['role', 'is_active']
    search_fields = ['email', 'username', 'university_id']
    fieldsets     = BaseUserAdmin.fieldsets + (
        ('ILES Fields', {'fields': ('role', 'university_id')}),
    )


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display  = ['student_name', 'student_id', 'course', 'year_of_study', 'semester']
    search_fields = ['student_name', 'student_id']


@admin.register(InternshipPlacement)
class PlacementAdmin(admin.ModelAdmin):
    list_display  = ['student', 'organization_name', 'position', 'placement_status', 'start_date', 'end_date']
    list_filter   = ['placement_status']
    search_fields = ['organization_name', 'student__student_name']


@admin.register(LogbookEntry)
class LogbookAdmin(admin.ModelAdmin):
    list_display  = ['placement', 'week_number', 'submission_status', 'hours_worked']
    list_filter   = ['submission_status']


@admin.register(Evaluation)
class EvaluationAdmin(admin.ModelAdmin):
    list_display  = ['placement', 'workplace_score', 'academic_score', 'logbook_score', 'total_score', 'grade']
    readonly_fields = ['total_score', 'grade', 'submission_date']


@admin.register(Issue)
class IssueAdmin(admin.ModelAdmin):
    list_display  = ['title', 'student', 'status', 'created_at']
    list_filter   = ['status']
    search_fields = ['title', 'student__email']


admin.site.register(InternshipAdministrator)
admin.site.register(WorkplaceSupervisor)
admin.site.register(AcademicSupervisor)
