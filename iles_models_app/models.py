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
        ('student',              'Student'),
        ('academic_supervisor',  'Academic Supervisor'),
        ('workplace_supervisor', 'Workplace Supervisor'),
        ('administrator',        'Administrator'),
    )
    email         = models.EmailField(unique=True)
    role          = models.CharField(max_length=30, choices=ROLE_CHOICES)
    university_id = models.CharField(max_length=50, unique=True)
    groups        = models.ManyToManyField('auth.Group',      related_name='iles_users', blank=True)
    user_permissions = models.ManyToManyField('auth.Permission', related_name='iles_users_perms', blank=True)

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = ['username', 'role', 'university_id']

    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"


# ── PROFILES ─────────────────────────────────────────────────────────────────

class Student(models.Model):
    user          = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='student_profile')
    student_id    = models.CharField(max_length=20, unique=True)
    student_name  = models.CharField(max_length=100)
    course        = models.CharField(max_length=100)
    year_of_study = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(4)])
    semester      = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(2)])

    def __str__(self):
        return self.student_name


class InternshipAdministrator(models.Model):
    user       = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='admin_profile')
    admin_id   = models.CharField(max_length=20, unique=True)
    admin_name = models.CharField(max_length=100)
    department = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.admin_name} — {self.department}"


class WorkplaceSupervisor(models.Model):
    user            = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='workplace_profile')
    supervisor_id   = models.CharField(max_length=20, unique=True)
    supervisor_name = models.CharField(max_length=100)
    job_title       = models.CharField(max_length=100)
    phone_number    = models.CharField(validators=[phone_regex], max_length=13, unique=True, help_text="Format: +256XXXXXXXXXX")
    department      = models.CharField(max_length=100)

    def __str__(self):
        return self.supervisor_name


class AcademicSupervisor(models.Model):
    user          = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='academic_profile')
    staff_id      = models.CharField(max_length=20, unique=True)
    lecturer_name = models.CharField(max_length=100)
    college_dept  = models.CharField(max_length=100)
    phone_number  = models.CharField(validators=[phone_regex], max_length=13, unique=True, help_text="Format: +256XXXXXXXXXX")

    def __str__(self):
        return self.lecturer_name


# ── PLACEMENT ────────────────────────────────────────────────────────────────

class PlacementStatus(models.TextChoices):
    PENDING  = 'Pending',  'Pending'
    ACTIVE   = 'Active',   'Active'
    COMPLETE = 'Complete', 'Complete'


class InternshipPlacement(models.Model):
    organization_name = models.CharField(max_length=100)
    position          = models.CharField(max_length=100)
    start_date        = models.DateField()
    end_date          = models.DateField()
    placement_status  = models.CharField(max_length=20, choices=PlacementStatus.choices, default=PlacementStatus.PENDING)

    student              = models.ForeignKey(Student,                 on_delete=models.CASCADE,  related_name='placements')
    administrator        = models.ForeignKey(InternshipAdministrator, on_delete=models.SET_NULL, null=True, blank=True)
    workplace_supervisor = models.ForeignKey(WorkplaceSupervisor,     on_delete=models.SET_NULL, null=True, blank=True)
    academic_supervisor  = models.ForeignKey(AcademicSupervisor,      on_delete=models.SET_NULL, null=True, blank=True)

    def clean(self):
        if self.start_date and self.end_date:
            if self.end_date < self.start_date:
                raise ValidationError("End date cannot be before start date.")
            overlaps = InternshipPlacement.objects.filter(
                student=self.student,
                start_date__lt=self.end_date,
                end_date__gt=self.start_date,
            ).exclude(pk=self.pk)
            if overlaps.exists():
                raise ValidationError("This student already has a placement in this date range.")

    def __str__(self):
        return f"{self.student.student_name} at {self.organization_name}"


# ── LOGBOOK ──────────────────────────────────────────────────────────────────

class LogStatus(models.TextChoices):
    DRAFT     = 'Draft',     'Draft'
    SUBMITTED = 'Submitted', 'Submitted'
    APPROVED  = 'Approved',  'Approved'


class LogbookEntry(models.Model):
    placement         = models.ForeignKey(InternshipPlacement, on_delete=models.CASCADE, related_name='logbooks')
    week_number       = models.IntegerField(validators=[MinValueValidator(1)])
    start_date        = models.DateField()
    end_date          = models.DateField()
    tasks_done        = models.TextField(help_text="Describe the specific technical tasks you worked on this week.")
    hours_worked      = models.DecimalField(max_digits=5, decimal_places=2, help_text="e.g. 8.5 for eight and a half hours")
    challenges        = models.TextField(default="None", help_text="Any challenges faced this week.")
    submission_status = models.CharField(max_length=20, choices=LogStatus.choices, default=LogStatus.DRAFT)
    submitted_at      = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('placement', 'week_number')
        ordering        = ['week_number']

    def clean(self):
        if self.hours_worked and self.hours_worked > 120:
            raise ValidationError({'hours_worked': 'Please enter realistic hours (max 120 hours per week).'})
        if self.hours_worked and self.hours_worked < 0:
            raise ValidationError({'hours_worked': 'Hours worked cannot be negative.'})

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Week {self.week_number} — {self.placement.student.student_name}"


# ── EVALUATION ───────────────────────────────────────────────────────────────

class Evaluation(models.Model):
    placement       = models.OneToOneField(InternshipPlacement, on_delete=models.CASCADE, related_name='evaluation')
    supervisor      = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='evaluations_given', null=True, blank=True)
    workplace_score = models.IntegerField(validators=[MinValueValidator(0), MaxValueValidator(100)], help_text="Workplace supervisor score (out of 100)")
    academic_score  = models.IntegerField(validators=[MinValueValidator(0), MaxValueValidator(100)], help_text="Academic supervisor score (out of 100)")
    logbook_score   = models.IntegerField(validators=[MinValueValidator(0), MaxValueValidator(100)], help_text="Logbook quality score (out of 100)")
    feedback        = models.TextField()
    submission_date = models.DateField(auto_now_add=True)

    @property
    def total_score(self):
        """Weighted: 40% workplace + 30% academic + 30% logbook"""
        w = (self.workplace_score or 0) * 0.4
        a = (self.academic_score  or 0) * 0.3
        l = (self.logbook_score   or 0) * 0.3
        return round(w + a + l, 2)

    @property
    def grade(self):
        t = self.total_score
        if t >= 80: return 'A'
        if t >= 70: return 'B'
        if t >= 60: return 'C'
        if t >= 50: return 'D'
        return 'F'

    def __str__(self):
        return f"Evaluation for {self.placement.student.student_name} — {self.total_score}%"


# ── ISSUE ────────────────────────────────────────────────────────────────────

class IssueStatus(models.TextChoices):
    PENDING   = 'Pending',   'Pending'
    IN_REVIEW = 'In Review', 'In Review'
    RESOLVED  = 'Resolved',  'Resolved'


class Issue(models.Model):
    student             = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='issues')
    placement           = models.ForeignKey(InternshipPlacement, on_delete=models.SET_NULL, null=True, blank=True, related_name='issues')
    title               = models.CharField(max_length=200)
    description         = models.TextField()
    status              = models.CharField(max_length=20, choices=IssueStatus.choices, default=IssueStatus.PENDING)
    supervisor_feedback = models.TextField(null=True, blank=True)
    created_at          = models.DateTimeField(auto_now_add=True)
    updated_at          = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name        = "Student Issue"
        verbose_name_plural = "Student Issues"
        ordering            = ['-created_at']

    def __str__(self):
        return f"{self.get_status_display()} — {self.title} ({self.student.email})"