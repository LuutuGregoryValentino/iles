from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Student, InternshipAdministrator, WorkplaceSupervisor,
    AcademicSupervisor, InternshipPlacement,
    LogbookEntry, Evaluation, Issue
)

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password =serializers.CharField(write_only=True)
    class Meta:
         model= User
         fields =[ 'username','id','email','university_id','role','password']
         
    def validate_email(self,value):
        if User.objects.filter(email=value).exists():
                raise serializers.ValidationError("Email already exists")
        return value
    
    def create(self,Validated_date):
        password =Validated_date.pop('password')
        user =User(**Validated_date)
        user.set_password(password)
        user.save()
        return user

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = ['id', 'email', 'username', 'university_id', 'role']


#  PROFILES 

class StudentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)# to use userserializer to formate student info #readonly to make sure when creating or updating u cant change student info thru dis serializer
    class Meta:
        model  = Student
        fields = '__all__'


class InternshipAdministratorSerializer(serializers.ModelSerializer):
    student = StudentSerializer(read_only=True)
    #this makes sure that Student can not change information thru this serializer when creating or updating placement
    class Meta:
        model  = InternshipAdministrator
        fields = '__all__'


class WorkplaceSupervisorSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)# to use userserializer to formate student info #readonly to make sure when creating or updating u cant change student info thru dis serializer
    class Meta:
        model  = WorkplaceSupervisor
        fields = '__all__'


class AcademicSupervisorSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model  = AcademicSupervisor
        fields = '__all__'


#  PLACEMENT 

class InternshipPlacementSerializer(serializers.ModelSerializer):
    student = StudentSerializer(read_only=True)#this makes sure that Student can not change information thru this serializer when creating or updating placement
    class Meta:
        model  = InternshipPlacement
        fields = '__all__'

    def validate(self, data):
        start = data.get('start_date')
        end   = data.get('end_date')
        if start and end and end < start:
            raise serializers.ValidationError("End date cannot be before start date.")
        return data


# LOGBOOK 

class LogbookEntrySerializer(serializers.ModelSerializer):
    student  =  StudentSerializer(read_only=True)#this makes sure that Student can not change information thru this serializer when creating or updating 
    class Meta:
        model  = LogbookEntry
        fields = "__all__"
        read_only_fields = ['submitted_at']


# EVALUATION

class EvaluationSerializer(serializers.ModelSerializer):
    total_score = serializers.ReadOnlyField()
    grade       = serializers.ReadOnlyField()

    class Meta:
        model  = Evaluation
        fields = '__all__'

    def validate(self, data):
        placement = data.get('placement') or (self.instance.placement if self.instance else None)
        if placement and Evaluation.objects.filter(placement=placement).exclude(pk=self.instance.pk if self.instance else None).exists():
            raise serializers.ValidationError("An evaluation already exists for this placement.")
        return data


#  ISSUE

class IssueSerializer(serializers.ModelSerializer):
    student = StudentSerializer(read_only=True)

    class Meta:
        model  = Issue
        fields = '__all__'
        read_only_fields = ['student', 'created_at', 'updated_at']
