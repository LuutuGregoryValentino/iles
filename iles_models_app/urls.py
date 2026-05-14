from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from . import views
from .views import StudentViewSet, PlacementViewSet

router = DefaultRouter()
router.register(r'students',   StudentViewSet,   basename='student')
router.register(r'placements', PlacementViewSet, basename='placement')

app_name = 'iles_models_app'

urlpatterns = [
    path('auth/register/', views.register,     name='register'),
    path('auth/login/',    views.login_api,    name='login'),
    path('auth/logout/',   views.logout_api,   name='logout'),
    path('auth/me/',       views.current_user, name='current-user'),
    path('auth/refresh/',  TokenRefreshView.as_view(), name='token-refresh'),
    path('auth/approve/<int:pk>/', views.approve_user, name='approve-user'),
    path('auth/pending/',          views.pending_users, name='pending-users'),
    path('supervisors/', views.supervisor_list, name='supervisor-list'),
    path('admins/',      views.admin_list,      name='admin-list'),
    path('logbooks/',          views.logbook_list,   name='logbook-list'),
    path('logbooks/<int:pk>/', views.logbook_detail, name='logbook-detail'),
    path('evaluations/',          views.evaluation_list,   name='evaluation-list'),
    path('evaluations/<int:pk>/', views.evaluation_detail, name='evaluation-detail'),
    path('issues/',          views.issue_list,   name='issue-list'),
    path('issues/<int:pk>/', views.issue_detail, name='issue-detail'),
    path('', include(router.urls)),
]