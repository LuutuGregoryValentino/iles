from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

app_name = 'iles_models_app'

urlpatterns = [
    # ── Auth ──────────────────────────────────────────────────────────────────
    path('auth/register/', views.register,     name='register'),
    path('auth/login/',    views.login_api,     name='login'),
    path('auth/logout/',   views.logout_api,    name='logout'),
    path('auth/me/',       views.current_user,  name='current-user'),
    path('auth/refresh/',  TokenRefreshView.as_view(), name='token-refresh'),

    # ── Students ──────────────────────────────────────────────────────────────
    path('students/',          views.student_list,   name='student-list'),
    path('students/<int:pk>/', views.student_detail, name='student-detail'),

    # ── Supervisors & admins ──────────────────────────────────────────────────
    path('supervisors/', views.supervisor_list, name='supervisor-list'),
    path('admins/',      views.admin_list,      name='admin-list'),

    # ── Placements ────────────────────────────────────────────────────────────
    path('placements/',            views.placement_list,   name='placement-list'),
    path('placements/<int:pk>/',   views.placement_detail, name='placement-detail'),

    # ── Logbooks ──────────────────────────────────────────────────────────────
    path('logbooks/',          views.logbook_list,   name='logbook-list'),
    path('logbooks/<int:pk>/', views.logbook_detail, name='logbook-detail'),

    # ── Evaluations ───────────────────────────────────────────────────────────
    path('evaluations/',          views.evaluation_list,   name='evaluation-list'),
    path('evaluations/<int:pk>/', views.evaluation_detail, name='evaluation-detail'),

    # ── Issues ────────────────────────────────────────────────────────────────
    path('issues/',          views.issue_list,   name='issue-list'),
    path('issues/<int:pk>/', views.issue_detail, name='issue-detail'),
]
