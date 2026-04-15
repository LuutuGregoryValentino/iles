from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings
from django.core.validators import RegexValidator
from django.core.exceptions import ValidationError

phone_regex = RegexValidator(
    regex=r'^\+256\d{9}$',
    message="Phone number must be in the format: '+256700000000'. Exactly 12 characters required."
)

class User(AbstractUser):
    email = models.EmailField(unique=True)
    ROLE_CHOICES = (
        ('student', 'Student'),
        ('academic_supervisor', 'Academic Supervisor'),
        ('workplace_supervisor', 'Workplace Supervisor'),
    )
    role = models.CharField(max_length=30, choices=ROLE_CHOICES)
    university_id = models.CharField(max_length=50, unique=True)
    groups = models.ManyToManyField('auth.Group', related_name='custom_user_groups', blank=True)
    user_permissions = models.ManyToManyField('auth.Permission', related_name='custom_user_permissions', blank=True)
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'role', 'university_id']

    def __str__(self):
        return f"{self.email} ({self.role})"


class student(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    student_id = models.CharField(max_length=20, unique=True)
    student_name = models.CharField(max_length=100)
    course = models.CharField(max_length=100)
    year_of_study = models.IntegerField()
    semester = models.IntegerField()

    def __str__(self):
        return self.student_name


class internship_administrator(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    admin_id = models.CharField(max_length=20, unique=True)
    admin_name = models.CharField(max_length=100)
    role = models.CharField(max_length=100)
    department = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.admin_name} at {self.department}"


class workplace_supervisor(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    supervisor_id = models.CharField(max_length=20, unique=True)
    supervisor_name = models.CharField(max_length=100)
    job_title = models.CharField(max_length=100)
    phone_number = models.CharField(validators=[phone_regex], max_length=13, unique=True, help_text="Format: +256XXXXXXXXXX")
    department = models.CharField(max_length=100)

    def __str__(self):
        return self.supervisor_name


class academic_supervisor(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    staff_id = models.CharField(max_length=20, unique=True)
    lecturers_name = models.CharField(max_length=100)
    college_dept = models.CharField(max_length=100)
    phone_number = models.CharField(validators=[phone_regex], max_length=13, unique=True, help_text="Format: +256XXXXXXXXXX")

    def __str__(self):
        return self.lecturers_name


class internship_placement(models.Model):
    placement_id = models.AutoField(primary_key=True)
    organization_name = models.CharField(max_length=100)
    position = models.CharField(max_length=100)
    start_date = models.DateField()
    end_date = models.DateField()
    placement_status = models.CharField(max_length=100)
    student = models.ForeignKey('student', on_delete=models.CASCADE, related_name='placements')
    internship_administrator = models.ForeignKey(internship_administrator, on_delete=models.SET_NULL, null=True, blank=True)
    workplace_supervisor = models.ForeignKey(workplace_supervisor, on_delete=models.SET_NULL, null=True, blank=True)
    academic_supervisor = models.ForeignKey(academic_supervisor, on_delete=models.SET_NULL, null=True, blank=True)

    def clean(self):
        if self.start_date and self.end_date:
            if self.end_date < self.start_date:
                raise ValidationError("End date cannot be earlier than start date.")

    def __str__(self):
        return f"{self.student.student_name} at {self.organization_name}"


class LogStatus(models.TextChoices):
    DRAFT = 'Draft', 'Draft'
    SUBMITTED = 'Submitted', 'Submitted'
    APPROVED = 'Approved', 'Approved'


class logbook_entry(models.Model):
    entry_id = models.AutoField(primary_key=True)
    placement = models.ForeignKey(internship_placement, on_delete=models.CASCADE, related_name='logbooks')
    week_number = models.IntegerField()
    start_date = models.DateField()
    end_date = models.DateField()
    tasks_done = models.TextField(help_text="Describe the specific technical tasks you worked on.")
    hours_worked = models.DecimalField(max_digits=5, decimal_places=2, help_text="Total hours, e.g. 8.5 for eight and a half hours.")
    challenges = models.TextField(default="None")
    logbook_submission_status = models.CharField(max_length=50, choices=LogStatus.choices, default=LogStatus.DRAFT)

    def __str__(self):
        return f"Log for {self.placement.student.student_name} — Week {self.week_number}"


class evaluation(models.Model):
    evaluation_id = models.AutoField(primary_key=True)
    placement = models.ForeignKey('internship_placement', on_delete=models.CASCADE, related_name='evaluations')
    supervisor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='submitted_evaluations', null=True, blank=True)
    rating_score = models.IntegerField()
    feedback = models.TextField()
    submission_date = models.DateField(auto_now_add=True)

    def __str__(self):
        return f"Evaluation for {self.placement.student.student_name}"


class IssueManager(models.Manager):
    def pending(self):
        return self.filter(status='Pending')


class issue(models.Model):
    objects = IssueManager()
    # FK to User (not student model) — student is the logged-in user
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    description = models.TextField()
    status = models.CharField(max_length=20, default='Pending', help_text="Current status of the reported issue.")
    week_number = models.PositiveIntegerField(default=1)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    supervisor_feedback = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        # student FK is a User — use email since User has no student_name
        return f"Issue by {self.student.email}: {self.title}"
