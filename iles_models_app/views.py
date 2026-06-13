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
    InternshipAdministrator, Evaluation, Issue, LogStatus, IssueStatus,
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
    notify_student_logbook_submitted,
    notify_supervisors_logbook_submitted,
    send_logbook_approved_email,
    notify_student_graded,
    notify_supervisors_issue_submitted,
    send_issue_resolved_email,
    notify_user_approved,
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
        # Explicitly decouple fields: Use provided values or keep defaults
        # These lines ensure that first_name, last_name, and username are set from request data
        # and are distinct from email, which is used as USERNAME_FIELD.
        user.username   = request.data.get('username', user.username).strip()
        user.first_name = request.data.get('first_name', '').strip()
        user.last_name  = request.data.get('last_name', '').strip()
        user.save()
        
        send_welcome_email(user)
        refresh = RefreshToken.for_user(user)
        return Response({
            'user':    UserSerializer(user).data,
            'access':  str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)
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
        return Response({'error': 'Invalid email or password.'}, status=status.HTTP_401_UNAUTHORIZED)
    
    # Blocking unapproved supervisors and administrators
    if user.role in ('academic_supervisor', 'workplace_supervisor','administrator') and not user.is_approved:
        return Response(
            {'error' : 'Your account is pending admin approval.You will receive an email once approved.'},
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


# ── STUDENTS (ViewSet) ────────────────────────────────────────────────────────

class StudentViewSet(ModelViewSet):
    serializer_class   = StudentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'student':
            return Student.objects.filter(user=user)
        # For admins, we want to see students who have profiles.
        # To see students without profiles, you'd check the User model.
        return Student.objects.all()

    def perform_create(self, serializer):
        # Just save the student profile linked to the current user
        user = self.request.user
        # Update core User fields from profile payload
        if 'first_name' in self.request.data: user.first_name = self.request.data['first_name']
        if 'last_name' in self.request.data:  user.last_name  = self.request.data['last_name']
        if 'username' in self.request.data:   user.username   = self.request.data['username']
        user.save()
        
        # Derive student_name for the profile table from User names
        full_name = f"{user.first_name} {user.last_name}".strip()
        serializer.save(user=user, student_name=full_name)

    def perform_update(self, serializer):
        user = self.request.user
        # Allow profile editing to update the core User entries
        # Sync profile changes back to the main User table
        if 'first_name' in self.request.data: user.first_name = self.request.data['first_name']
        if 'last_name' in self.request.data:  user.last_name  = self.request.data['last_name']
        if 'username' in self.request.data:   user.username   = self.request.data['username']
        user.save()
        
        full_name = f"{user.first_name} {user.last_name}".strip()
        serializer.save(student_name=full_name or self.request.user.username)


# ── PLACEMENTS (ViewSet) ──────────────────────────────────────────────────────

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
        # Notify student and both supervisors about the new placement
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
            obj = s.save(submitted_at=timezone.now())
            notify_student_logbook_submitted(obj)
            notify_supervisors_logbook_submitted(obj)
        elif new_status == LogStatus.APPROVED:
            obj = s.save()
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
        prev_status = obj.status
        obj = s.save()
        # Notify student if the issue has been marked as Resolved
        if obj.status == IssueStatus.RESOLVED and prev_status != IssueStatus.RESOLVED:
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
    
    was_approved = target.is_approved
    target.is_approved = request.data.get('is_approved', True)
    target.save()
    if target.is_approved and not was_approved:
        notify_user_approved(target)
    return Response(UserSerializer(target).data)

@api_view(['GET'])
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
        role__in=['administrator', 'workplace_supervisor', 'academic_supervisor']
    )
    return Response(UserSerializer(pending, many=True).data)