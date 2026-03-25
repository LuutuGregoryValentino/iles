from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),           # homepage
    path('student/', views.student_list, name='student_list'),  # optional
]