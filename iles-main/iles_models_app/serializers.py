from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    student, internship_administrator, workplace_supervisor,
    academic_supervisor, internship_placement,
    logbook_entry, evaluation, issue
)

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'university_id', 'role', 'password']
    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'university_id', 'role']

class studentSerializer(serializers.ModelSerializer):
    class Meta:
        model = student
        fields = '__all__'

class internship_administratorSerializer(serializers.ModelSerializer):
    class Meta:
        model = internship_administrator
        fields = '__all__'

class workplace_supervisorSerializer(serializers.ModelSerializer):
    class Meta:
        model = workplace_supervisor
        fields = '__all__'

class academic_supervisorSerializer(serializers.ModelSerializer):
    class Meta:
        model = academic_supervisor
        fields = '__all__'

class internship_placementSerializer(serializers.ModelSerializer):
    class Meta:
        model = internship_placement
        fields = '__all__'

class logbook_entrySerializer(serializers.ModelSerializer):
    class Meta:
        model = logbook_entry
        fields = '__all__'

class evaluationSerializer(serializers.ModelSerializer):
    class Meta:
        model = evaluation
        fields = '__all__'

class issueSerializer(serializers.ModelSerializer):
    class Meta:
        model = issue
        fields = '__all__'
