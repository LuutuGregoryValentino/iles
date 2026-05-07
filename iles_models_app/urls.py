from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'students',   views.StudentViewSet,   basename='student')
router.register(r'placements', views.PlacementViewSet, basename='placement')

urlpatterns = [
    # Auth
    path('auth/register/', views.register,     name='register'),
    path('auth/login/',    views.login_api,    name='login'),
    path('auth/logout/',   views.logout_api,   name='logout'),
    path('auth/me/',       views.current_user, name='current-user'),

    # User approval (admin only)
    path('users/pending/',          views.pending_users, name='pending-users'),
    path('users/<int:pk>/approve/', views.approve_user,  name='approve-user'),

    # Supervisors and admins
    path('supervisors/', views.supervisor_list, name='supervisor-list'),
    path('admins/',      views.admin_list,      name='admin-list'),

    # Logbooks
    path('logbooks/',          views.logbook_list,   name='logbook-list'),
    path('logbooks/<int:pk>/', views.logbook_detail, name='logbook-detail'),

    # Evaluations
    path('evaluations/',          views.evaluation_list,   name='evaluation-list'),
    path('evaluations/<int:pk>/', views.evaluation_detail, name='evaluation-detail'),

    # Issues
    path('issues/',          views.issue_list,   name='issue-list'),
    path('issues/<int:pk>/', views.issue_detail, name='issue-detail'),

    # ViewSet routes
    path('', include(router.urls)),
]