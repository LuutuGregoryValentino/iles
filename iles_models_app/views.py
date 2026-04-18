from django.contrib.auth import get_user_model, authenticate
from django.utils import timezone

from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from .models import (
    Student, WorkplaceSupervisor, AcademicSupervisor,
    InternshipPlacement, LogbookEntry,
    InternshipAdministrator, Evaluation, Issue, LogStatus
)
from .serializers import (
    StudentSerializer, InternshipAdministratorSerializer,
    WorkplaceSupervisorSerializer, InternshipPlacementSerializer,
    LogbookEntrySerializer, AcademicSupervisorSerializer,
    EvaluationSerializer, IssueSerializer,
    RegisterSerializer, UserSerializer,
)

User = get_user_model()


# ── HELPERS ───────────────────────────────────────────────────────────────────

def is_admin_or_supervisor(user):
    return user.role in ('administrator', 'academic_supervisor', 'workplace_supervisor')

def is_student(user):
    return user.role == 'student'


# ── AUTH ──────────────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user    = serializer.save()
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
        return Response({'error': 'Invalid or missing refresh token.'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    return Response(UserSerializer(request.user).data)


# ── STUDENTS ──────────────────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def student_list_api(request):
    if request.method == 'GET':
        if is_student(request.user):
            students = Student.objects.filter(user=request.user)
        else:
            students = Student.objects.all()
        return Response(StudentSerializer(students, many=True).data)

    s = StudentSerializer(data=request.data)
    if s.is_valid():
        s.save(user=request.user)
        return Response(s.data, status=status.HTTP_201_CREATED)
    return Response(s.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def student_detail_api(request, pk):
    try:
        obj = Student.objects.get(pk=pk)
    except Student.DoesNotExist:
        return Response({'error': 'Student not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(StudentSerializer(obj).data)

    if request.method == 'PUT':
        s = StudentSerializer(obj, data=request.data, partial=True)
        if s.is_valid():
            s.save()
            return Response(s.data)
        return Response(s.errors, status=status.HTTP_400_BAD_REQUEST)

    if not is_admin_or_supervisor(request.user):
        return Response({'error': 'Only administrators can delete student records.'}, status=status.HTTP_403_FORBIDDEN)
    obj.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


# ── SUPERVISORS & ADMINS ──────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def supervisor_list(request):
    if request.method == 'GET':
        return Response(WorkplaceSupervisorSerializer(WorkplaceSupervisor.objects.all(), many=True).data)
    s = WorkplaceSupervisorSerializer(data=request.data)
    if s.is_valid():
        s.save()
        return Response(s.data, status=status.HTTP_201_CREATED)
    return Response(s.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def admin_list(request):
    if request.method == 'GET':
        return Response(InternshipAdministratorSerializer(InternshipAdministrator.objects.all(), many=True).data)
    s = InternshipAdministratorSerializer(data=request.data)
    if s.is_valid():
        s.save()
        return Response(s.data, status=status.HTTP_201_CREATED)
    return Response(s.errors, status=status.HTTP_400_BAD_REQUEST)


# ── PLACEMENTS ────────────────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def placement_list(request):
    if request.method == 'GET':
        if is_student(request.user):
            placements = InternshipPlacement.objects.filter(student__user=request.user)
        else:
            placements = InternshipPlacement.objects.all()
        return Response(InternshipPlacementSerializer(placements, many=True).data)

    if is_student(request.user):
        return Response({'error': 'Only administrators can create placements.'}, status=status.HTTP_403_FORBIDDEN)
    s = InternshipPlacementSerializer(data=request.data)
    if s.is_valid():
        s.save()
        return Response(s.data, status=status.HTTP_201_CREATED)
    return Response(s.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def placement_detail(request, pk):
    try:
        obj = InternshipPlacement.objects.get(pk=pk)
    except InternshipPlacement.DoesNotExist:
        return Response({'error': 'Placement not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(InternshipPlacementSerializer(obj).data)

    if request.method == 'PUT':
        if is_student(request.user):
            return Response({'error': 'Students cannot edit placements.'}, status=status.HTTP_403_FORBIDDEN)
        s = InternshipPlacementSerializer(obj, data=request.data, partial=True)
        if s.is_valid():
            s.save()
            return Response(s.data)
        return Response(s.errors, status=status.HTTP_400_BAD_REQUEST)

    if request.user.role != 'administrator':
        return Response({'error': 'Only administrators can delete placements.'}, status=status.HTTP_403_FORBIDDEN)
    obj.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


# ── LOGBOOKS ──────────────────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def logbook_list(request):
    if request.method == 'GET':
        if is_student(request.user):
            logbooks = LogbookEntry.objects.filter(placement__student__user=request.user)
        else:
            logbooks = LogbookEntry.objects.all()
        return Response(LogbookEntrySerializer(logbooks, many=True).data)

    s = LogbookEntrySerializer(data=request.data)
    if s.is_valid():
        s.save()
        return Response(s.data, status=status.HTTP_201_CREATED)
    return Response(s.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def logbook_detail(request, pk):
    try:
        obj = LogbookEntry.objects.get(pk=pk)
    except LogbookEntry.DoesNotExist:
        return Response({'error': 'Logbook entry not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(LogbookEntrySerializer(obj).data)

    if obj.submission_status == LogStatus.APPROVED:
        return Response({'error': 'Approved logbook entries cannot be edited.'}, status=status.HTTP_403_FORBIDDEN)

    new_status = request.data.get('submission_status')
    if new_status == LogStatus.APPROVED and is_student(request.user):
        return Response({'error': 'Only supervisors can approve logbook entries.'}, status=status.HTTP_403_FORBIDDEN)

    s = LogbookEntrySerializer(obj, data=request.data, partial=True)
    if s.is_valid():
        if new_status == LogStatus.SUBMITTED and not obj.submitted_at:
            s.save(submitted_at=timezone.now())
        else:
            s.save()
        return Response(s.data)
    return Response(s.errors, status=status.HTTP_400_BAD_REQUEST)


# ── EVALUATIONS ───────────────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def evaluation_list(request):
    if request.method == 'GET':
        if is_student(request.user):
            evaluations = Evaluation.objects.filter(placement__student__user=request.user)
        else:
            evaluations = Evaluation.objects.all()
        return Response(EvaluationSerializer(evaluations, many=True).data)

    if is_student(request.user):
        return Response({'error': 'Students cannot submit evaluations.'}, status=status.HTTP_403_FORBIDDEN)
    s = EvaluationSerializer(data=request.data)
    if s.is_valid():
        s.save(supervisor=request.user)
        return Response(s.data, status=status.HTTP_201_CREATED)
    return Response(s.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def evaluation_detail(request, pk):
    try:
        obj = Evaluation.objects.get(pk=pk)
    except Evaluation.DoesNotExist:
        return Response({'error': 'Evaluation not found.'}, status=status.HTTP_404_NOT_FOUND)
    return Response(EvaluationSerializer(obj).data)


# ── ISSUES ────────────────────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def issue_list(request):
    if request.method == 'GET':
        if is_student(request.user):
            issues = Issue.objects.filter(student=request.user)
        else:
            issues = Issue.objects.all()
        return Response(IssueSerializer(issues, many=True).data)

    s = IssueSerializer(data=request.data)
    if s.is_valid():
        s.save(student=request.user)
        return Response(s.data, status=status.HTTP_201_CREATED)
    return Response(s.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def issue_detail(request, pk):
    try:
        obj = Issue.objects.get(pk=pk)
    except Issue.DoesNotExist:
        return Response({'error': 'Issue not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(IssueSerializer(obj).data)

    if is_student(request.user):
        if obj.student != request.user:
            return Response({'error': 'You can only edit your own issues.'}, status=status.HTTP_403_FORBIDDEN)
        if 'status' in request.data:
            return Response({'error': 'Students cannot change issue status.'}, status=status.HTTP_403_FORBIDDEN)

    s = IssueSerializer(obj, data=request.data, partial=True)
    if s.is_valid():
        s.save()
        return Response(s.data)
    return Response(s.errors, status=status.HTTP_400_BAD_REQUEST)