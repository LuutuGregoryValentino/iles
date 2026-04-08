from django.urls import path
from . import views
from rest_framework_simplejwt.views import(
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('', views.home, name='home'),          # homepage

    # Existing paths for students, supervisors and Admins
    path('student/', views.student_list_api, name='student-list'),
    path('supervisors/', views.supervisor_list_api, name='supervisor-list'),
    path('admins/', views.admin_list_api, name='admin-list'),
    path('logbooks/', views.logbook_list_api, name='logbook-list'),
    path('evaluations/', views.evaluation_list_api, name='evaluation-list'),
    path('issues/', views.issue_list_api, name='issue-list'),


    # JWT Authentication paths
    #THIS IS FOR THE LOGIN ENDPOINT
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    #THIS IS FOR THE REFRESH TOKEN
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]