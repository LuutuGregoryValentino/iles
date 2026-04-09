from urllib import request

from .models import student, workplace_supervisor, academic_supervisor, internship_placement, logbook_entry,internship_administrator,evaluation
from .serializers import  studentSerializer,internship_administratorSerializer,workplace_supervisorSerializer, internship_placementSerializer, logbook_entrySerializer,internship_administratorSerializer,academic_supervisorSerializer,evaluationSerializer,issueSerializer
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.shortcuts import render

from rest_framework.permissions import IsAuthenticated


#to add a URL and view for the empty path,

    

@api_view(['GET','POST'])
@permission_classes([IsAuthenticated])
def student_list_api(request):
    if request.method == 'GET':
        if request.user.role == 'student':
            students = student.objects.filter(user=request.user)
        else:
            students = student.objects.all()
        serializer =studentSerializer(students,many=True)
        return Response(serializer.data)
    elif request.method == 'POST':
        serializer = studentSerializer(data=request.data)
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
        serializer = workplace_supervisorSerializer(supervisors, many=True)
        return Response(serializer.data)
    elif request.method == 'POST':
        serializer = workplace_supervisorSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)
@api_view(['GET','POST'])
def admin_list_api(request):
    if request.method == 'GET':
        admins = internship_administrator.objects.all()
        serializer = internship_administratorSerializer(admins,many=True)
        return Response(serializer.data)
    elif request.method == 'POST':
        serializer = internship_administratorSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data,status=201)
    return Response(serializer.errors,status=400)

"""
this is to make sure the student only sees thier own entries in the logbook  and the admin and supervisors can see all entries.
"""
@api_view(['GET'])
@permission_classes(IsAuthenticated)
def logbook_list_api(request):
    if request.method =='GET':
       # the authorization
       if request.user.role =='student':
           log_books= logbook_entry.objects.filter(placement__student__user=request.user)
           #this is to check placement folow student foreign key .check if user account matches one logged in.student oly see theirs
       else:
           #supervisor and admin can see everything
           logbooks = logbook_entry.objects.all()
        
           serializer =logbook_entrySerializer(logbooks ,many=True)
           return Response(serializer.data)
    elif request.method == 'PPOST':
        serializer = issueSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data,status=201)
        return Response(serializer.errors,status=400)

@api_view(['GET', 'POST'])
def evaluation_list_api(request):
    if request.method == 'GET':
        if request.user.role == 'student':
            # students here can only see their evaluations
            evaluations = evaluation.objects.filter(placement__student__user=request.user) # the same as in students view chain upto the user
        elif request.user.role == 'workplace_supervisor':
            # also the workplace_supervisor can oly see his evaluation
            evaluations = evaluation.objects.filter(supervisor=request.user)
        else:
            # admin can see all evaluations in data base
            evaluations = evaluation.objects.all()
            
        serializer = evaluationSerializer(evaluations, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        if request.user.role != 'workplace_supervisor':
            return Response(
                {"detail": "Only workplace supervisor can submit evaluation"}, 
                status=403
            )
        
        serializer = evaluationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        
        return Response(serializer.errors, status=400)

@api_view(['GET', 'POST'])
def issue_list_api(request):
    if request.method == 'GET':
        # Students see only their issues; Admins see everything
        if request.user.role == 'student':
            issues = issue.objects.filter(student=request.user)
        else:
            issues = issue.objects.all()
        serializer = issueSerializer(issues, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = issueSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(student=request.user)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)