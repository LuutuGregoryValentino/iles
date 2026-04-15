from .models import student,internship_administrator,workplace_supervisor, academic_supervisor, internship_placement,logbook_entry,evaluation,issue
from  django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()

class RegisterSerializer(serializer.ModelSerializer)
      password =serializer.CharField(write_only=True,min_length=8)

      class Meta:
         model= User
         fields =[ 'id','email','university_id','role','password']

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'university_id', 'role']
class StudentSerializer(serializers.ModelSerializer):
       class Meta:
            model =student
            fields='__all__'
class Internship_administratorSerializer(serializers.ModelSerializer):
        class Meta:
             model = internship_administrator
             fields='__all__'
class Workplace_supervisorSerializer(serializers.ModelSerializer):
            class Meta:
             model =workplace_supervisor
             fields='__all__'
class Internship_placementSerializer(serializers.ModelSerializer):
            class Meta:
             model =internship_placement
             fields='__all__'
class Logbook_entrySerializer(serializers.ModelSerializer):
            class Meta:
             model =logbook_entry
             fields='__all__'
class Academic_supervisorSerializer(serializers.ModelSerializer):
      class Meta:
          model =academic_supervisor
          fields='__all__'
class EvaluationSerializer(serializers.ModelSerializer):
      class Meta:
            model =evaluation
            fields='__all__'
           
class IssueSerializer(serializers.ModelSerializer):
      class Meta:
            model = issue
            fields = '__all__'