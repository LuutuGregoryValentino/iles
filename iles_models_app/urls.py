from django.urls import path
from . import views
urlpatterns =[
path('student/',views.student_list),
path('work_place/',views.workplace_supervisors,),
]