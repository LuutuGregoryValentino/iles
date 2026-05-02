from django.contrib import admin

from .models import(User,Student,InternshipAdministrator,WorkplaceSupervisor,InternshipPlacement,LogbookEntry,Evaluation,Issue)

admin.site.register(User)
admin.site.register(Student)
admin.site.register(InternshipAdministrator)
admin.site.register(WorkplaceSupervisor)
admin.site.register(InternshipPlacement)
admin.site.register(LogbookEntry)
admin.site.register(Evaluation)
admin.site.register(Issue)from django.contrib import admin
from .models import (
    User, Student, InternshipAdministrator, WorkplaceSupervisor,
    InternshipPlacement, LogbookEntry, Evaluation, Issue
)


# ── USER ADMIN ─────────────────────────────────────────
@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('email', 'role', 'university_id')
    search_fields = ('email', 'university_id')
    list_filter = ('role',)


# ── STUDENT ADMIN ──────────────────────────────────────
@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('student_name', 'student_id', 'course', 'year_of_study')
    search_fields = ('student_name', 'student_id')


# ── PLACEMENT ADMIN ────────────────────────────────────
@admin.register(InternshipPlacement)
class PlacementAdmin(admin.ModelAdmin):
    list_display = ('student', 'organization_name', 'placement_status', 'start_date', 'end_date')
    list_filter = ('placement_status',)
    search_fields = ('organization_name',)


# ── LOGBOOK ADMIN ──────────────────────────────────────
@admin.register(LogbookEntry)
class LogbookAdmin(admin.ModelAdmin):
    list_display = ('placement', 'week_number', 'hours_worked', 'submission_status')
    list_filter = ('submission_status',)


# ── EVALUATION ADMIN ───────────────────────────────────
@admin.register(Evaluation)
class EvaluationAdmin(admin.ModelAdmin):
    list_display = ('placement', 'total_score', 'grade')


# ── ISSUE ADMIN ────────────────────────────────────────
@admin.register(Issue)
class IssueAdmin(admin.ModelAdmin):
    list_display = ('title', 'student', 'status', 'created_at')
    list_filter = ('status',)


# ── OTHER MODELS ───────────────────────────────────────
admin.site.register(InternshipAdministrator)
admin.site.register(WorkplaceSupervisor)