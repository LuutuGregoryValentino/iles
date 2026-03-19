from .models import student,internship_administrator,workplace_supervisor, academic_supervisor, internship_placement,logbook_entry
from rest_framework import serializers
class studentSrializer(serializers.ModelSerializer):
       class Meta:
            model =student
            fields='__all__'
class internship_administratorSrializer(serializers.ModelSerializer):
        class Meta:
             model = internship_administrator
             fields='__all__'
class workplace_supervisorSrializer(serializers.ModelSerializer):
            class Meta:
             model =workplace_supervisor
             fields='__all__'
class internship_placementSrializer(serializers.ModelSerializer):
            class Meta:
             model =internship_placement
             fields='__all__'
class logbook_entry(serializers.ModelSerializer):
            class Meta:
             model =logbook_entry
             fields='__all__'
           
