from .models import student,internship_administrator,workplace_supervisor,academic_supervisor,internship_placement,logbook_entry
from .serializers import  studentSrialiser,internship_administratorSrialiser,workplace_supervisorSrialiser,internship_placementSrialiser,logbook_entry
from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.shortcuts import render

#to add a URL and view for the empty path,

def home(request):
    return render(request, 'home.html')

@api_view(['GET'])
def student_list_api(request):
     students =student.objects.all()
     serializer =studentSrialiser(Students,many=True)
     return Response(serializer.data)

def student_list(request):
    return render(request, 'student_list.html')
# Create your views here.
@api_view(['GET'])
def supervisor_list_api(request):
    supervisors = workplace_supervisor.objects.all()
    serializer = workplace_supervisorSrialiser(supervisors,many=True)
    return Response(serializer.data)
@api_view(['GET'])
def admin_list_api(request):
    admins = internship_administrator.objects.all()
    serializer = internship_administratorSrialiser(admins,many=True)
    return Response(serializer.data)

