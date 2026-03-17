from .models import student,internship_administrator,workplace_supervisor,academic_supervisor,internship_placement,logbook_entry
from .serializers import  studentSrialiser,internship_administratorSrialiser,workplace_supervisorSrialiser,internship_placementSrialiser,logbook_entry
from rest_framework.response import Response
from rest_framework.decorators import api_view
@api_view(['GET'])
def student_list(request):
     Students =student.objects.all()
     serializer =studentSrialiser(Students,many=True)
     return Response(serializer.data)

# Create your views here.
