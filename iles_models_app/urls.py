from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from . import views
from rest_framework.routers import DefaultRouter
from .views import StudentViewSet, PlacementViewSet

router = DefaultRouter()
router.register(r'students', StudentViewSet, basename='student')
router.register(r'placements', PlacementViewSet, basename='placement')

app_name = 'iles_models_app'

urlpatterns = [

    # ── AUTH ─────────────────────────────────────────────
    path('auth/register/', views.register, name='register'),
    path('auth/login/', views.login_api, name='login'),
    path('auth/logout/', views.logout_api, name='logout'),
    path('auth/me/', views.current_user, name='current-user'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token-refresh'),

    # ── ADMIN DASHBOARD ──────────────────────────────────
    path('admin/dashboard/', views.admin_dashboard_api, name='admin-dashboard'),

    # ── ROUTER (VIEWSETS) ────────────────────────────────
    path('', include(router.urls)),

    # ── SUPERVISORS & ADMINS ────────────────────────────
    path('supervisors/', views.supervisor_list, name='supervisor-list'),
    path('admins/', views.admin_list, name='admin-list'),

    # ── PLACEMENTS ──────────────────────────────────────
    path('placements/', views.placement_list, name='placement-list'),
    path('placements/<int:pk>/', views.placement_detail, name='placement-detail'),

    # ── LOGBOOKS ────────────────────────────────────────
    path('logbooks/', views.logbook_list, name='logbook-list'),
    path('logbooks/<int:pk>/', views.logbook_detail, name='logbook-detail'),

    # ── EVALUATIONS ─────────────────────────────────────
    path('evaluations/', views.evaluation_list, name='evaluation-list'),
    path('evaluations/<int:pk>/', views.evaluation_detail, name='evaluation-detail'),

    # ── ISSUES ──────────────────────────────────────────
    path('issues/', views.issue_list, name='issue-list'),
    path('issues/<int:pk>/', views.issue_detail, name='issue-detail'),
]