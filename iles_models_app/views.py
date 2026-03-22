from .models import student, workplace_supervisor, academic_supervisor, internship_placement, logbook_entry,internship_administrator
from .serializers import  studentSrializer,internship_administratorSrializer,workplace_supervisorSrializer, internship_placementSrializer, logbook_entry,internship_administratorSrializer,academic_supervisorSeriazer
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

@api_view(['GET','POST'])
def academic_supervisor(request):
     if request.method=='GET':
        academic_supervisor =academic_supervisor.objects.all()
        serializer =academic_supervisorSeriazer(academic_supervisor,many=True)
        return Response(serializer.data)
     elif request.method == 'POST':
          serializer = academic_supervisorSeriazer(data=request.data)
          if serializer.is_valid():
               serializer.save()
               return Response(serializer.data,status=201)
          return Response(serializer.errors,status=400)
                            

@api_view(['GET','POST'])
def internship_administratorSrializer(request):
     if request.method=='GET':
          internship_administrator= internship_administrator.objects.all()
          serializer=internship_administratorSrializer(internship_administrator)
          return Response(serializer.data)
     elif request.metho =='POST':
          serializer=internship_administratorSrializer(data=request.data)
          if serializer.is_valid():
               serializer.save()
               return Response(serializer.datat,status=201)
          return Response(serializer.errors,status=400)

@api_view(['GET','POST'])
def  internship_placement(request):
     if request.method=='GET':
          internship_placement=internship_placement.objects.all()
          serializer=internship_placementSrializer(internship_placement,many=True)
          return Response(serializer.data)
     elif request.method == 'POST':
          serializer = internship_placementSrializer(data=request.data)
          if serializer.is_valid():
               serializer.save()
               return Response(serializer.data,status=201)
          return Response(serializer.errors,status=400)
     
@api_view(['GET','POST'])
def logbook_entry(request):
     if request.method == 'GET':
          logbook_entry = logbook_entry.objects.all()
          serializer = logbook_entry(logbook_entry,many=True)
          return Response(serializer.data)
     elif request.method == 'POST':
          serializer = logbook_entry(data=request.data)
          if serializer.is_valid():
               serializer.save()
               return Response(serializer.data,status=201)
          return Response(serializer.errors,status=400)



     