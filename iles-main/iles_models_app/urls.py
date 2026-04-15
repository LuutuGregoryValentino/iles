from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

app_name = 'iles_models_app'

urlpatterns = [
    path('', views.home, name='home'),

    # Auth
    path('auth/register/', views.register,    name='register'),
    path('auth/login/',    views.login_api,    name='login'),
    path('auth/logout/',   views.logout_api,   name='logout'),
    path('auth/me/',       views.current_user, name='current-user'),
    path('auth/refresh/',  TokenRefreshView.as_view(), name='token-refresh'),

    # Students
    path('students/',      views.student_list_api,    name='student-list'),
    path('students/<int:pk>/', views.student_detail_api, name='student-detail'),

    # Supervisors & admins
    path('supervisors/',   views.supervisor_list_api,  name='supervisor-list'),
    path('admins/',        views.admin_list_api,        name='admin-list'),

    # Placements
    path('placements/',    views.placement_list_api,   name='placement-list'),
    path('placements/<int:pk>/', views.placement_detail_api, name='placement-detail'),

    # Logbooks & evaluations
    path('logbooks/',      views.logbook_list_api,     name='logbook-list'),
    path('evaluations/',   views.evaluation_list_api,  name='evaluation-list'),

    # Issues
    path('issues/',        views.issue_list_api,       name='issue-list'),
    path('issues/<int:pk>/', views.issue_detail_api,   name='issue-detail'),
]
