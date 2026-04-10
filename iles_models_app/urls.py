from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),          # homepage

    # Existing paths for students, supervisors and Admins
    path('student/', views.student_list_api, name='student-list'),
    path('supervisors/', views.supervisor_list_api, name='supervisor-list'),
    path('admins/', views.admin_list_api, name='admin-list'),

    # paths for logbooks and Evaluations
    path('logbooks/', views.logbook_list_api, name='logbook-list'),
    path('evaluations/', views.evaluation_list_api, name='evaluation-list'),

    # Special view for Displaying issues
    path('issues/', views.issue_list_api, name='issue-list'),
]