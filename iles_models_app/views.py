from django.contrib.auth import get_user_model, authenticate
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings

from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.viewsets import ModelViewSet
from rest_framework.exceptions import ValidationError,PermissionDenied



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
from .validators import validate_strong_password


User = get_user_model()


#  HELPERS

def is_admin_or_supervisor(user):
    return user.role in ('administrator', 'academic_supervisor', 'workplace_supervisor')

def is_student(user):
    return user.role == 'student'


# AUTH 

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
def validate_password(self, value):
    validate_strong_password(value)



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


# STUDENTS 

class StudentViewSet(ModelViewSet):
    serializer_class = StudentSerializer
    permission_classes =[IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'student':
            return Student.objects.filter(user=user)
        return Student.objects.all()
    def perform_create(self,serializer):
        if hasattr(self.request.user,'student_profile'):
            raise ValidationError("you already have astudent profile")# make sure student dont create duplicate accounts
        serializer.save(user=self.request.user)
    def perform_destroy(self,instance):
        if self.request.user.role != 'administrator':
            raise PermissionDenied("only admins can delete student records")
        instance.delete()
    


   
    



# SUPERVISORS & ADMINS 

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


# PLACEMENTS 

class PlacementViewSet(ModelViewSet):
    serializer_class = InternshipPlacementSerializer
    permission_classes = [IsAuthenticated]


    def get_queryset(self):
        user = self.request.user

        if user.role == "sudent":
            return InternshipPlacement.objects.filter(student__user =user)
        return InternshipPlacement.objects.all()
    
    def perform_create(self,serializer):
        if self.request.user.role == 'student':
            raise PermissionDenied('only administrators can create placement')
        
        serializer.save()
    def perform_destroy(self, instance):
        if self.request.user.role != 'administrator':
            raise PermissionDenied("only adninistrators can delete placement")
        instance.delete()

    




#  LOGBOOk

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
            #TRIGGER NOTIFICATION
            student_email = obj.placement.student.user.email
            workplace_supervisor_email = obj.placement.workplace_supervisor.user.email
            send_mail(subject = "ILES:New Logbook Submission Pending Review", message =f"Hello,\n\nA new logbook entry has been submitted by {student_email}and is awaiting your review.\n\nPlease log into the ILES dashboard to approve or request changes.",from_email =settings.EMAIL_HOST_USER,recipient_list =[workplace_supervisor_email,student_email],fail_silently=False,)
            #__________________________
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


# ── ISSUES

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