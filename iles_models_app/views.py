from .models import student, workplace_supervisor, academic_supervisor, internship_placement, logbook_entry
from .serializers import  studentSrializer,internship_administratorSrializer,workplace_supervisorSrializer, internship_placementSrializer, logbook_entry
from rest_framework.response import Response
from rest_framework.decorators import api_view

@api_view(['GET','POST'])
def student_list(request):
     if request.method== "GET":
          Students =student.objects.all()
          serializer =studentSrializer(Students,many=True)
          return Response(serializer.data)
     elif request.method == "POST":
          serializer = studentSrializer(data = request.data)
          if serializer.is_valid():
               serializer .save()
               return Response(serializer.data, status =201) 
          return Response(serializer.errors, status =400)
@api_view(['GET','POST'])
def workplace_supervisors(request):
     if request.method =="GET":
          supervisor=workplace_supervisor.objects.all()
          serializer =workplace_supervisorSrializer(supervisor, many=True)
          return Response(serializer.data)
     elif request.method == "POST":
          serializer = workplace_supervisorSrializer(data= request.data)
          if serializer.is_valid():
               serializer.save
               return Response(serializer.data,status =201)
          return Response(serializer.errors,status=400)        
# Create your views here.
