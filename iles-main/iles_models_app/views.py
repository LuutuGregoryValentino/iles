from django.shortcuts import render
from django.contrib.auth import get_user_model, authenticate

from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from .models import (
    student, workplace_supervisor, academic_supervisor,
    internship_placement, logbook_entry,
    internship_administrator, evaluation, issue
)
from .serializers import (
    studentSerializer, internship_administratorSerializer,
    workplace_supervisorSerializer, internship_placementSerializer,
    logbook_entrySerializer, academic_supervisorSerializer,
    evaluationSerializer, issueSerializer,
    RegisterSerializer, UserSerializer,
)

User = get_user_model()


def home(request):
    return render(request, 'home.html')

def student_list(request):
    return render(request, 'student_list.html')


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user':    UserSerializer(user).data,
            'access':  str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_api(request):
    email    = request.data.get('email', '').strip()
    password = request.data.get('password', '')
    if not email or not password:
        return Response({'error': 'Email and password are required.'}, status=status.HTTP_400_BAD_REQUEST)
    user = authenticate(request, username=email, password=password)
    if user is None:
        return Response({'error': 'Invalid email or password.'}, status=status.HTTP_401_UNAUTHORIZED)
    refresh = RefreshToken.for_user(user)
    return Response({
        'user':    UserSerializer(user).data,
        'access':  str(refresh.access_token),
        'refresh': str(refresh),
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_api(request):
    try:
        token = RefreshToken(request.data.get('refresh'))
        token.blacklist()
        return Response({'message': 'Logged out successfully.'})
    except Exception:
        return Response({'error': 'Invalid token.'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    return Response(UserSerializer(request.user).data)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def student_list_api(request):
    if request.method == 'GET':
        return Response(studentSerializer(student.objects.all(), many=True).data)
    serializer = studentSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def student_detail_api(request, pk):
    try:
        obj = student.objects.get(pk=pk)
    except student.DoesNotExist:
        return Response({'error': 'Student not found.'}, status=status.HTTP_404_NOT_FOUND)
    if request.method == 'GET':
        return Response(studentSerializer(obj).data)
    elif request.method == 'PUT':
        s = studentSerializer(obj, data=request.data, partial=True)
        if s.is_valid():
            s.save()
            return Response(s.data)
        return Response(s.errors, status=status.HTTP_400_BAD_REQUEST)
    obj.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def supervisor_list_api(request):
    if request.method == 'GET':
        return Response(workplace_supervisorSerializer(workplace_supervisor.objects.all(), many=True).data)
    serializer = workplace_supervisorSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def admin_list_api(request):
    if request.method == 'GET':
        return Response(internship_administratorSerializer(internship_administrator.objects.all(), many=True).data)
    serializer = internship_administratorSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def placement_list_api(request):
    if request.method == 'GET':
        return Response(internship_placementSerializer(internship_placement.objects.all(), many=True).data)
    serializer = internship_placementSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def placement_detail_api(request, pk):
    try:
        obj = internship_placement.objects.get(pk=pk)
    except internship_placement.DoesNotExist:
        return Response({'error': 'Placement not found.'}, status=status.HTTP_404_NOT_FOUND)
    if request.method == 'GET':
        return Response(internship_placementSerializer(obj).data)
    elif request.method == 'PUT':
        s = internship_placementSerializer(obj, data=request.data, partial=True)
        if s.is_valid():
            s.save()
            return Response(s.data)
        return Response(s.errors, status=status.HTTP_400_BAD_REQUEST)
    obj.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def logbook_list_api(request):
    if request.method == 'GET':
        return Response(logbook_entrySerializer(logbook_entry.objects.all(), many=True).data)
    serializer = logbook_entrySerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def evaluation_list_api(request):
    if request.method == 'GET':
        return Response(evaluationSerializer(evaluation.objects.all(), many=True).data)
    serializer = evaluationSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def issue_list_api(request):
    if request.method == 'GET':
        return Response(issueSerializer(issue.objects.all(), many=True).data)
    serializer = issueSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(student=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def issue_detail_api(request, pk):
    try:
        obj = issue.objects.get(pk=pk)
    except issue.DoesNotExist:
        return Response({'error': 'Issue not found.'}, status=status.HTTP_404_NOT_FOUND)
    if request.method == 'GET':
        return Response(issueSerializer(obj).data)
    serializer = issueSerializer(obj, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
