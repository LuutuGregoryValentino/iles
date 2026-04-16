from django.contrib import admin
from .models import *

# ───────────────── USER ADMIN ─────────────────

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('email', 'username', 'role', 'university_id', 'is_active', 'is_staff')
    list_filter = ('role', 'is_active', 'is_staff')
    search_fields = ('email', 'username', 'university_id')
    ordering = ('email',)


# ───────────────── PROFILE ADMINS ─────────────────

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('student_name', 'student_id', 'course', 'year_of_study', 'semester')
    search_fields = ('student_name', 'student_id', 'course')
    list_filter = ('course', 'year_of_study', 'semester')


@admin.register(InternshipAdministrator)
class InternshipAdministratorAdmin(admin.ModelAdmin):
    list_display = ('admin_name', 'admin_id', 'department')
    search_fields = ('admin_name', 'admin_id', 'department')


@admin.register(WorkplaceSupervisor)
class WorkplaceSupervisorAdmin(admin.ModelAdmin):
    list_display = ('supervisor_name', 'supervisor_id', 'job_title', 'department', 'phone_number')
    search_fields = ('supervisor_name', 'supervisor_id', 'department')
    list_filter = ('department',)


@admin.register(AcademicSupervisor)
class AcademicSupervisorAdmin(admin.ModelAdmin):
    list_display = ('lecturer_name', 'staff_id', 'college_dept', 'phone_number')
    search_fields = ('lecturer_name', 'staff_id', 'college_dept')
    list_filter = ('college_dept',)


# ───────────────── INLINE (POWER FEATURE) ─────────────────

class LogbookInline(admin.TabularInline):
    model = LogbookEntry
    extra = 0
    readonly_fields = ('submission_status', 'submitted_at')


# ───────────────── PLACEMENT ADMIN ─────────────────

@admin.register(InternshipPlacement)
class InternshipPlacementAdmin(admin.ModelAdmin):
    list_display = (
        'student',
        'organization_name',
        'position',
        'placement_status',
        'start_date',
        'end_date'
    )
    list_filter = ('placement_status', 'start_date', 'end_date')
    search_fields = (
        'student__student_name',
        'organization_name',
        'position'
    )
    date_hierarchy = 'start_date'
    inlines = [LogbookInline]


# ───────────────── LOGBOOK ADMIN ─────────────────

@admin.register(LogbookEntry)
class LogbookEntryAdmin(admin.ModelAdmin):
    list_display = (
        'placement',
        'week_number',
        'hours_worked',
        'submission_status',
        'submitted_at'
    )
    list_filter = ('submission_status',)
    search_fields = ('placement__student__student_name',)
    ordering = ('week_number',)
    readonly_fields = ('submitted_at',)


# ───────────────── EVALUATION ADMIN ─────────────────

@admin.register(Evaluation)
class EvaluationAdmin(admin.ModelAdmin):
    list_display = (
        'placement',
        'workplace_score',
        'academic_score',
        'logbook_score',
        'total_score',
        'grade',
        'submission_date'
    )
    list_filter = ('submission_date',)
    search_fields = ('placement__student__student_name',)
    readonly_fields = ('total_score', 'grade')


# ───────────────── ISSUE ADMIN ─────────────────

@admin.register(Issue)
class IssueAdmin(admin.ModelAdmin):
    list_display = (
        'title',
        'student',
        'placement',
        'status',
        'created_at',
        'updated_at'
    )
    list_filter = ('status', 'created_at')
    search_fields = ('title', 'student__email')
    readonly_fields = ('created_at', 'updated_at')


# ───────────────── ADMIN PANEL BRANDING ─────────────────

admin.site.site_header = "Internship Management System"
admin.site.site_title = "IMS Admin"
admin.site.index_title = "Welcome to IMS Dashboard"
