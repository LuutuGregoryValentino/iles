from .models import student,internship_administrator,workplace_supervisor,academic_supervisor,internship_placement,logbook_entry
from .serializers import  studentSrialiser,internship_administratorSrialiser,workplace_supervisorSrialiser,internship_placementSrialiser,logbook_entrySrializer
from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.shortcuts import render


#to add a URL and view for the empty path,

def home(request):
    return render(request, 'home.html')

@api_view(['GET','POST'])
def student_list_api(request):
    if request.method == 'GET':
        students =student.objects.all()
        serializer =studentSrialiser(students,many=True)
        return Response(serializer.data)
    elif request.method == 'POST':
        serializer = studentSrialiser(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data,status=201)
        return Response(serializer.errors,status=400)

def student_list(request):
    return render(request, 'student_list.html')
# Create your views here.
@api_view(['GET', 'POST'])
def supervisor_list_api(request):
    if request.method == 'GET':
        supervisors = workplace_supervisor.objects.all()
        serializer = workplace_supervisorSrialiser(supervisors, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = workplace_supervisorSrialiser(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)
@api_view(['GET','POST'])
def admin_list_api(request):
    if request.method == 'GET':
        admins = internship_administrator.objects.all()
        serializer = internship_administratorSrialiser(admins,many=True)
        return Response(serializer.data)
    elif request.method == 'POST':
        serializer = internship_administratorSrialiser(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data,status=201)
    return Response(serializer.errors,status=400)

@api_view(['GET'])
def issue_list_api(request):
    issues = logbook_entry.objects.exclude(challenge="None").exclude(challenges="")
    serializer = logbook_entrySrialiser(issues,many=True)
    return Response(serializer.data)