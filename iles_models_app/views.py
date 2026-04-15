from django.shortcuts import render
from django.contrib.auth import get_user_model, authenticate

from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.shortcuts import render
from rest_framework.permissions import IsAuthenticated

#to add a URL and view for the empty path,
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from .models import (
    student, workplace_supervisor, academic_supervisor,
    internship_placement, logbook_entry,
    internship_administrator, evaluation, issue
)
from .serializers import (
    studentSerializer,
    internship_administratorSerializer,
    workplace_supervisorSerializer,
    internship_placementSerializer,
    logbook_entrySerializer,
    academic_supervisorSerializer,
    evaluationSerializer,
    issueSerializer,
    RegisterSerializer,
    UserSerializer,
)

User = get_user_model()


# ─────────────────────────────────────────────────────────────────────────────
#  TEMPLATE VIEWS (kept for Django admin navigation)
# ─────────────────────────────────────────────────────────────────────────────

def home(request):
    return render(request, 'home.html')

def student_list(request):
    return render(request, 'student_list.html')


# ─────────────────────────────────────────────────────────────────────────────
#  AUTH  —  register / login / logout / me / token-refresh
# ─────────────────────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """
    POST /api/auth/register/
    Body: { email, username, university_id, role, password }
    Returns: user info + access + refresh tokens
    """
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
    """
    POST /api/auth/login/
    Body: { email, password }
    Returns: user info + access + refresh tokens
    """
    email    = request.data.get('email', '').strip()
    password = request.data.get('password', '')

    if not email or not password:
        return Response(
            {'error': 'Email and password are required.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Django's authenticate() uses username field internally;
    # our custom User model has USERNAME_FIELD = 'email'
    user = authenticate(request, username=email, password=password)

    if user is None:
        return Response(
            {'error': 'Invalid email or password.'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    refresh = RefreshToken.for_user(user)
    return Response({
        'user':    UserSerializer(user).data,
        'access':  str(refresh.access_token),
        'refresh': str(refresh),
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_api(request):
    """
    POST /api/auth/logout/
    Body: { refresh }
    Blacklists the refresh token so it can no longer be used.
    """
    try:
        refresh_token = request.data.get('refresh')
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response(
            {'message': 'Logged out successfully.'},
            status=status.HTTP_200_OK
        )
    except Exception:
        return Response(
            {'error': 'Invalid or missing refresh token.'},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    """
    GET /api/auth/me/
    Returns the currently logged-in user's info.
    """
    return Response(UserSerializer(request.user).data)


# ─────────────────────────────────────────────────────────────────────────────
#  STUDENTS
# ─────────────────────────────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def student_list_api(request):
    """
    GET  /api/students/  — list all students
    POST /api/students/  — create a new student profile
    """
    if request.method == 'GET':
        students = student.objects.all()
        serializer = studentSerializer(students, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = studentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def student_detail_api(request, pk):
    """
    GET    /api/students/<pk>/  — retrieve one student
    PUT    /api/students/<pk>/  — update a student (partial allowed)
    DELETE /api/students/<pk>/  — delete a student
    """
    try:
        obj = student.objects.get(pk=pk)
    except student.DoesNotExist:
        return Response({'error': 'Student not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(studentSerializer(obj).data)

    elif request.method == 'PUT':
        serializer = studentSerializer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─────────────────────────────────────────────────────────────────────────────
#  WORKPLACE SUPERVISORS
# ─────────────────────────────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def supervisor_list_api(request):
    """
    GET  /api/supervisors/  — list all workplace supervisors
    POST /api/supervisors/  — create a new workplace supervisor
    """
    if request.method == 'GET':
        supervisors = workplace_supervisor.objects.all()
        serializer = workplace_supervisorSerializer(supervisors, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = workplace_supervisorSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─────────────────────────────────────────────────────────────────────────────
#  INTERNSHIP ADMINISTRATORS
# ─────────────────────────────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def admin_list_api(request):
    """
    GET  /api/admins/  — list all internship administrators
    POST /api/admins/  — create a new administrator record
    """
    if request.method == 'GET':
        admins = internship_administrator.objects.all()
        serializer = internship_administratorSerializer(admins, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = internship_administratorSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─────────────────────────────────────────────────────────────────────────────
#  INTERNSHIP PLACEMENTS
# ─────────────────────────────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def placement_list_api(request):
    """
    GET  /api/placements/  — list all placements
    POST /api/placements/  — create a new placement
    """
    if request.method == 'GET':
        placements = internship_placement.objects.all()
        serializer = internship_placementSerializer(placements, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = internship_placementSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def placement_detail_api(request, pk):
    """
    GET    /api/placements/<pk>/  — retrieve one placement
    PUT    /api/placements/<pk>/  — update a placement
    DELETE /api/placements/<pk>/  — delete a placement
    """
    try:
        obj = internship_placement.objects.get(pk=pk)
    except internship_placement.DoesNotExist:
        return Response({'error': 'Placement not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(internship_placementSerializer(obj).data)

    elif request.method == 'PUT':
        serializer = internship_placementSerializer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─────────────────────────────────────────────────────────────────────────────
#  LOGBOOK ENTRIES
# ─────────────────────────────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def logbook_list_api(request):
    """
    GET  /api/logbooks/  — list all logbook entries
    POST /api/logbooks/  — submit a new weekly logbook entry
    """
    if request.method == 'GET':
        logbooks = logbook_entry.objects.all()
        serializer = logbook_entrySerializer(logbooks, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = logbook_entrySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─────────────────────────────────────────────────────────────────────────────
#  EVALUATIONS
# ─────────────────────────────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def evaluation_list_api(request):
    """
    GET  /api/evaluations/  — list all evaluations
    POST /api/evaluations/  — submit a new evaluation
    """
    if request.method == 'GET':
        evaluations = evaluation.objects.all()
        serializer = evaluationSerializer(evaluations, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = evaluationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─────────────────────────────────────────────────────────────────────────────
#  ISSUES
# ─────────────────────────────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def issue_list_api(request):
    """
    GET  /api/issues/  — list all issues
    POST /api/issues/  — report a new issue (student auto-set from token)
    """
    if request.method == 'GET':
        issues = issue.objects.all()
        serializer = issueSerializer(issues, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = issueSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(student=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def issue_detail_api(request, pk):
    """
    GET   /api/issues/<pk>/  — retrieve one issue
    PATCH /api/issues/<pk>/  — update issue status (admin use)
    """
    try:
        obj = issue.objects.get(pk=pk)
    except issue.DoesNotExist:
        return Response({'error': 'Issue not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(issueSerializer(obj).data)

    elif request.method == 'PATCH':
        serializer = issueSerializer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)