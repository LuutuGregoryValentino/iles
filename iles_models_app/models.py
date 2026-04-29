from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings
from django.core.validators import RegexValidator, MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError

phone_regex = RegexValidator(
    regex=r'^\+256\d{9}$',
    message="Phone must be in format: +256700000000"
)

# ── USER ─────────────────────────────────────────────────────────────────────
class User(AbstractUser):
    ROLE_CHOICES = (
        ('student', 'Student'),
        ('academic_supervisor', 'Academic Supervisor'),
        ('workplace_supervisor', 'Workplace Supervisor'),
        ('administrator', 'Administrator'),
    )
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=30, choices=ROLE_CHOICES)
    university_id = models.CharField(max_length=50, unique=True)

    groups = models.ManyToManyField('auth.Group', related_name='iles_users', blank=True)
    user_permissions = models.ManyToManyField('auth.Permission', related_name='iles_users_perms', blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'role', 'university_id']

    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"

# ── PROFILES ─────────────────────────────────────────────────────────────────
class Student(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='student_profile')
    student_id = models.CharField(max_length=20, unique=True)
    student_name = models.CharField(max_length=100)
    course = models.CharField(max_length=100)
    year_of_study = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(4)])
    semester = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(2)])

    def __str__(self):
        return self.student_name


class InternshipAdministrator(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='admin_profile')
    admin_id = models.CharField(max_length=20, unique=True)
    admin_name = models.CharField(max_length=100)
    department = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.admin_name} — {self.department}"


class WorkplaceSupervisor(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='workplace_profile')
    supervisor_id = models.CharField(max_length=20, unique=True)
    supervisor_name = models.CharField(max_length=100)
    job_title = models.CharField(max_length=100)
    phone_number = models.CharField(validators=[phone_regex], max_length=13, unique=True)
    department = models.CharField(max_length=100)

    def __str__(self):
        return self.supervisor_name


class AcademicSupervisor(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='academic_profile')
    staff_id = models.CharField(max_length=20, unique=True)
    lecturer_name = models.CharField(max_length=100)
    college_dept = models.CharField(max_length=100)
    phone_number = models.CharField(validators=[phone_regex], max_length=13, unique=True)

    def __str__(self):
        return self.lecturer_name

# ── PLACEMENT ────────────────────────────────────────────────────────────────
class PlacementStatus(models.TextChoices):
    PENDING = 'Pending', 'Pending'
    ACTIVE = 'Active', 'Active'
    COMPLETE = 'Complete', 'Complete'


class InternshipPlacement(models.Model):
    organization_name = models.CharField(max_length=100)
    position = models.CharField(max_length=100)
    start_date = models.DateField()
    end_date = models.DateField()
    placement_status = models.CharField(max_length=20, choices=PlacementStatus.choices, default=PlacementStatus.PENDING)

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='placements')
    administrator = models.ForeignKey(InternshipAdministrator, on_delete=models.SET_NULL, null=True, blank=True)
    workplace_supervisor = models.ForeignKey(WorkplaceSupervisor, on_delete=models.SET_NULL, null=True, blank=True)
    academic_supervisor = models.ForeignKey(AcademicSupervisor, on_delete=models.SET_NULL, null=True, blank=True)

    def clean(self):
        if self.end_date < self.start_date:
            raise ValidationError("End date cannot be before start date.")

    def __str__(self):
        return f"{self.student.student_name} at {self.organization_name}"

# ── LOGBOOK ──────────────────────────────────────────────────────────────────
class LogStatus(models.TextChoices):
    DRAFT = 'Draft', 'Draft'
    SUBMITTED = 'Submitted', 'Submitted'
    APPROVED = 'Approved', 'Approved'


class LogbookEntry(models.Model):
    placement = models.ForeignKey(InternshipPlacement, on_delete=models.CASCADE, related_name='logbooks')
    week_number = models.IntegerField(validators=[MinValueValidator(1)])
    tasks_done = models.TextField()
    hours_worked = models.DecimalField(max_digits=5, decimal_places=2)

    def __str__(self):
        return f"Week {self.week_number}"

# ── ISSUE ────────────────────────────────────────────────────────────────────
class IssueStatus(models.TextChoices):
    PENDING = 'Pending', 'Pending'
    IN_REVIEW = 'In Review', 'In Review'
    RESOLVED = 'Resolved', 'Resolved'


class Issue(models.Model):
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=IssueStatus.choices, default=IssueStatus.PENDING)

    def __str__(self):
        return self.title