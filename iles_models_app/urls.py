from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),           # homepage
    path('student/', views.student_list_api, name='student-list'),  # optional
    path('supervisors/',views.supervisor_list_api,name='supervisor-list'),
    path('admins/', views.admin_list_api,name='admin-list'),
]