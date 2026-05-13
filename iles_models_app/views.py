from django.contrib.auth import get_user_model, authenticate
from django.utils import timezone

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
    send_placement_assigned_email,
    send_logbook_submitted_email,
    send_logbook_approved_email,
    send_issue_reported_email,
    send_issue_resolved_email,
    send_evaluation_email,
)
from .validators import validate_strong_password


User = get_user_model()


def is_admin(user):
    return user.role == 'administrator'

def is_student(user):
    return user.role == 'student'

def is_admin_or_supervisor(user):
    return user.role in ('administrator', 'academic_supervisor', 'workplace_supervisor')


# ── AUTH ──────────────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        try:
            user = serializer.save()
            # Auto-approve students so they can login immediately
            # Supervisors and admins need manual approval
            if user.role == 'student':
                try:
                    user.is_approved = True
                    user.save()
                except Exception:
                    pass  # is_approved may not exist locally — ignore
            refresh = RefreshToken.for_user(user)
            send_welcome_email(user)
            return Response({
                'user':    UserSerializer(user).data,
                'access':  str(refresh.access_token),
                'refresh': str(refresh),
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
def validate_password(self, value):
    validate_strong_password(value)
    
    return value


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
    # Check approval safely — never crashes even if field missing
    is_approved = getattr(user, 'is_approved', True)
    if not is_approved and not is_student(user):
        return Response(
            {'error': 'Your account is pending approval by an administrator.'},
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


# ── APPROVE USER — admin only ─────────────────────────────────────────────────

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def approve_user(request, pk):
    if not is_admin(request.user):
        return Response(
            {'error': 'Only administrators can approve accounts.'},
            status=status.HTTP_403_FORBIDDEN
        )
    try:
        target = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
    try:
        target.is_approved = True
        target.save()
    except Exception:
        pass
    return Response({
        'message': f'{target.username} has been approved.',
        'user':    UserSerializer(target).data,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pending_users(request):
    if not is_admin(request.user):
        return Response(
            {'error': 'Only administrators can view pending accounts.'},
            status=status.HTTP_403_FORBIDDEN
        )
    try:
        pending = User.objects.filter(is_approved=False).exclude(role='student')
    except Exception:
        pending = []
    return Response(UserSerializer(pending, many=True).data)


# ── STUDENTS ──────────────────────────────────────────────────────────────────

class StudentViewSet(ModelViewSet):
    serializer_class   = StudentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if is_student(self.request.user):
            return Student.objects.filter(user=self.request.user)
        return Student.objects.all()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# ── PLACEMENTS ────────────────────────────────────────────────────────────────

class PlacementViewSet(ModelViewSet):
    serializer_class   = InternshipPlacementSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if is_student(self.request.user):
            return InternshipPlacement.objects.filter(student__user=self.request.user)
        return InternshipPlacement.objects.all()

    def perform_create(self, serializer):
        placement = serializer.save()
        send_placement_assigned_email(placement)

    def perform_update(self, serializer):
        placement = serializer.save()
        send_placement_assigned_email(placement)


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
            s.save(submitted_at=timezone.now())
            send_logbook_submitted_email(obj)
        elif new_status == LogStatus.APPROVED:
            s.save()
            send_logbook_approved_email(obj)
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
            evals = Evaluation.objects.filter(
                placement__student__user=request.user)
        else:
            evals = Evaluation.objects.all()
        return Response(EvaluationSerializer(evals, many=True).data)
    if is_student(request.user):
        return Response(
            {'error': 'Students cannot submit evaluations.'},
            status=status.HTTP_403_FORBIDDEN
        )
    s = EvaluationSerializer(data=request.data)
    if s.is_valid():
        instance = s.save(supervisor=request.user)
        send_evaluation_email(instance)
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
        instance = s.save(student=request.user)
        send_issue_reported_email(instance)
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

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def approve_user(request, pk):
    """
    Approve a user account (admin only).
    PATCH /api/auth/approve/<pk>/
    Body: {"is_approved": true}
    """
    if request.user.role != 'administrator' or not request.user.is_approved:
        return Response({'error':'Only approved administrators can approve users.'}, status=403)
    
    try:
        target = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=404)
    
    target.is_approved = request.data.get('is_approved', True)
    target.save()
    return Response(UserSerializer(target).data)

@api_view
@permission_classes([IsAuthenticated])
def pending_users(request):
    """
    List unapproved users (admin only).
    GET /api/auth/pending/
    """
    if request.user.role !='administrator' or not request.user.is_approved:
        return Response({'error': 'Only approved administrators can view pending users.'},status=403)
    
    pending = User.objects.filter(
        is_approved=False,
        role_in=['administrator', 'workplace_supervisor', 'academic_supervisor']
    )
    return Response(UserSerializer(pending, many=True).data)