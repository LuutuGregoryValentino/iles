from django.contrib.auth import get_user_model, authenticate
from django.utils import timezone
from django.conf import settings

from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.viewsets import ModelViewSet

from .models import (
    Student, WorkplaceSupervisor, AcademicSupervisor,
    InternshipPlacement, LogbookEntry,
    InternshipAdministrator, Evaluation, Issue, LogStatus,
    PlacementStatus,
)
from .serializers import (
    StudentSerializer, InternshipAdministratorSerializer,
    WorkplaceSupervisorSerializer, InternshipPlacementSerializer,
    LogbookEntrySerializer, AcademicSupervisorSerializer,
    EvaluationSerializer, IssueSerializer,
    RegisterSerializer, UserSerializer,
)
from .emails import (
    send_welcome_email,
    notify_student_placement_assigned,
    notify_workplace_supervisor_placement_assigned,
    notify_academic_supervisor_placement_assigned,
    notify_supervisors_logbook_submitted,
    notify_supervisors_issue_submitted,
    notify_student_graded,
    notify_user_approved,
    send_logbook_approved_email,
    send_issue_resolved_email,
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
        send_welcome_email(user)
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
        return Response(
            {'error': 'Email and password are required.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    user = authenticate(request, username=email, password=password)
    if user is None:
        return Response(
            {'error': 'Invalid email or password.'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    if user.role in ('academic_supervisor', 'workplace_supervisor', 'administrator') and not user.is_approved:
        return Response(
            {'error': 'Your account is pending admin approval. You will receive an email once approved.'},
            status=status.HTTP_403_FORBIDDEN
        )
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
        return Response(
            {'error': 'Invalid or missing refresh token.'},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    return Response(UserSerializer(request.user).data)


# ── STUDENTS ──────────────────────────────────────────────────────────────────

class StudentViewSet(ModelViewSet):
    serializer_class   = StudentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'student':
            return Student.objects.filter(user=user)
        return Student.objects.all()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# ── PLACEMENTS ────────────────────────────────────────────────────────────────

class PlacementViewSet(ModelViewSet):
    serializer_class   = InternshipPlacementSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'student':
            return InternshipPlacement.objects.filter(student__user=user)
        return InternshipPlacement.objects.all()

    def perform_create(self, serializer):
        placement = serializer.save()
        notify_student_placement_assigned(placement.student, placement)
        notify_workplace_supervisor_placement_assigned(placement)
        notify_academic_supervisor_placement_assigned(placement)


# ── SUPERVISORS & ADMINS ──────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def supervisor_list(request):
    if request.method == 'GET':
        return Response(WorkplaceSupervisorSerializer(
            WorkplaceSupervisor.objects.all(), many=True).data)
    s = WorkplaceSupervisorSerializer(data=request.data)
    if s.is_valid():
        s.save()
        return Response(s.data, status=status.HTTP_201_CREATED)
    return Response(s.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def admin_list(request):
    if request.method == 'GET':
        return Response(InternshipAdministratorSerializer(
            InternshipAdministrator.objects.all(), many=True).data)
    s = InternshipAdministratorSerializer(data=request.data)
    if s.is_valid():
        s.save()
        return Response(s.data, status=status.HTTP_201_CREATED)
    return Response(s.errors, status=status.HTTP_400_BAD_REQUEST)


# ── LOGBOOKS ──────────────────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def logbook_list(request):
    if request.method == 'GET':
        if is_student(request.user):
            logbooks = LogbookEntry.objects.filter(
                placement__student__user=request.user)
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
        return Response(
            {'error': 'Logbook entry not found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    if request.method == 'GET':
        return Response(LogbookEntrySerializer(obj).data)

    if obj.submission_status == LogStatus.APPROVED:
        return Response(
            {'error': 'Approved logbook entries cannot be edited.'},
            status=status.HTTP_403_FORBIDDEN
        )

    new_status = request.data.get('submission_status')
    if new_status == LogStatus.APPROVED and is_student(request.user):
        return Response(
            {'error': 'Only supervisors can approve logbook entries.'},
            status=status.HTTP_403_FORBIDDEN
        )

    s = LogbookEntrySerializer(obj, data=request.data, partial=True)
    if s.is_valid():
        if new_status == LogStatus.SUBMITTED and not obj.submitted_at:
            logbook = s.save(submitted_at=timezone.now())
            notify_supervisors_logbook_submitted(logbook)
        elif new_status == LogStatus.APPROVED:
            logbook = s.save()
            send_logbook_approved_email(logbook)
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
            evaluations = Evaluation.objects.filter(
                placement__student__user=request.user)
        else:
            evaluations = Evaluation.objects.all()
        return Response(EvaluationSerializer(evaluations, many=True).data)

    if is_student(request.user):
        return Response(
            {'error': 'Students cannot submit evaluations.'},
            status=status.HTTP_403_FORBIDDEN
        )
    s = EvaluationSerializer(data=request.data)
    if s.is_valid():
        evaluation = s.save(supervisor=request.user)
        notify_student_graded(evaluation)
        return Response(s.data, status=status.HTTP_201_CREATED)
    return Response(s.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def evaluation_detail(request, pk):
    try:
        obj = Evaluation.objects.get(pk=pk)
    except Evaluation.DoesNotExist:
        return Response(
            {'error': 'Evaluation not found.'},
            status=status.HTTP_404_NOT_FOUND
        )
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
        issue = s.save(student=request.user)
        notify_supervisors_issue_submitted(issue)
        return Response(s.data, status=status.HTTP_201_CREATED)
    return Response(s.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def issue_detail(request, pk):
    try:
        obj = Issue.objects.get(pk=pk)
    except Issue.DoesNotExist:
        return Response(
            {'error': 'Issue not found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    if request.method == 'GET':
        return Response(IssueSerializer(obj).data)

    if is_student(request.user):
        if obj.student != request.user:
            return Response(
                {'error': 'You can only edit your own issues.'},
                status=status.HTTP_403_FORBIDDEN
            )
        if 'status' in request.data:
            return Response(
                {'error': 'Students cannot change issue status.'},
                status=status.HTTP_403_FORBIDDEN
            )

    s = IssueSerializer(obj, data=request.data, partial=True)
    if s.is_valid():
        s.save()
        if request.data.get('status') == 'Resolved':
            send_issue_resolved_email(obj)
        return Response(s.data)
    return Response(s.errors, status=status.HTTP_400_BAD_REQUEST)


# ── USER APPROVAL ─────────────────────────────────────────────────────────────

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def approve_user(request, pk):
    if request.user.role != 'administrator' or not request.user.is_approved:
        return Response(
            {'error': 'Only approved administrators can approve users.'},
            status=403
        )
    try:
        target = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=404)

    was_approved = target.is_approved
    target.is_approved = request.data.get('is_approved', True)
    target.save()
    if target.is_approved and not was_approved:
        notify_user_approved(target)
    return Response(UserSerializer(target).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pending_users(request):
    if request.user.role != 'administrator' or not request.user.is_approved:
        return Response(
            {'error': 'Only approved administrators can view pending users.'},
            status=403
        )
    pending = User.objects.filter(
        is_approved=False,
        role__in=['administrator', 'workplace_supervisor', 'academic_supervisor']
    )
    return Response(UserSerializer(pending, many=True).data)