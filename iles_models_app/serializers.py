from .models import student,internship_administrator,workplace_supervisor,academic_supervisor,internship_placement,logbook_entry
from rest_framework import  serializers
class studentSrialiser(serializers.ModelSerializer):
       class Meta:
            model =student
            fields='__all__'
class internship_administratorSrialiser(serializers.ModelSerializer):
        class Meta:
             model = internship_administrator
             fields='__all__'
class workplace_supervisorSrialiser(serializers.ModelSerializer):
            class Meta:
             modal =workplace_supervisor
             fields='__all__'
class internship_placementSrialiser(serializers.ModelSerializer):
            class Meta:
             modal =internship_placement
             fields='__all__'
class logbook_entry(serializers.ModelSerializer):
            class Meta:
             modal =logbook_entry
             fields='__all__'
           
    