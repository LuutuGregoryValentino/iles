from .models import student,internship_administrator,workplace_supervisor, academic_supervisor, internship_placement,logbook_entry,evaluation,issue
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
      @classmethod
      def get_token(cls, user):
            token = super().get_token(user)
            #adding custom claims
            token['username']=user.username
            token['role']=user.role
            return token



class studentSerializer(serializers.ModelSerializer):
       class Meta:
            model =student
            fields='__all__'
class internship_administratorSerializer(serializers.ModelSerializer):
        class Meta:
             model = internship_administrator
             fields='__all__'
class workplace_supervisorSerializer(serializers.ModelSerializer):
            class Meta:
             model =workplace_supervisor
             fields='__all__'
class internship_placementSerializer(serializers.ModelSerializer):
            class Meta:
             model =internship_placement
             fields='__all__'
class logbook_entrySerializer(serializers.ModelSerializer):
            class Meta:
             model =logbook_entry
             fields='__all__'
class academic_supervisorSerializer(serializers.ModelSerializer):
      class Meta:
          model =academic_supervisor
          fields='__all__'
class evaluationSerializer(serializers.ModelSerializer):
      class Meta:
            model =evaluation
            fields='__all__'
           
class issueSerializer(serializers.ModelSerializer):
      class Meta:
            model = issue
            fields = '__all__'