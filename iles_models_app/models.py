from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings

class User(AbstractUser):
    email = models.EmailField(unique=True)
    ROLE_CHOICES = (
        ('student','Student'),
        ('academic_supervisor','Academic Supervisor'),
        ('workplace_supervisor','Workplace Supervisor'),
    )
    role = models.CharField(max_length=30,choices=ROLE_CHOICES)
    university_id = models.CharField(max_length=50,unique=True)
    groups = models.ManyToManyField(
        'auth.Group', related_name="custom_user_groups",blank=True,
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission', related_name="custom_user_permissions",blank=True,
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username','role','university_id']

    def __str__(self):
        return f"{self.email}({self.role})"


class student(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL,on_delete=models.CASCADE)
    student_id = models.CharField(max_length=20,unique=True)
    student_name = models.CharField(max_length= 100)
    course = models.CharField(max_length = 100)
    year_of_study = models.IntegerField()
    semester = models.IntegerField()
    def __str__(self):
        return self.student_name
    
class internship_administrator(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL,on_delete=models.CASCADE)
    admin_id = models.CharField(max_length =20,unique=True)
    admin_name = models.CharField(max_length =100)
    role =models.CharField(max_length =100)
    department = models.CharField(max_length =100)
    def __str__(self):
        return f"{self.admin_name} at {self.department}"
    
class workplace_supervisor(models.Model):
    user =models.OneToOneField(settings.AUTH_USER_MODEL,on_delete=models.CASCADE)
    supervisor_id =models.CharField(max_length=20,unique=True)
    supervisor_name = models.CharField(max_length = 100)
    job_title =models.CharField(max_length=100)
    phone_number = models.CharField(max_length =10)
    department =models.CharField(max_length=100)
    def __str__(self):
        return self.supervisor_name
    
class academic_supervisor(models.Model):
    user=models.OneToOneField('iles_models_app.User',on_delete=models.CASCADE)
    staff_id =models.CharField(max_length =20,unique=True)
    lecturers_name =models.CharField(max_length =100)
    college_dept =models.CharField (max_length =100)
    phone_number = models.CharField(max_length =10)
    def __str__(self):
        return self.lecturers_name
    

class internship_placement(models.Model):
    placement_id = models.AutoField(primary_key =True)
    organization_name = models.CharField(max_length = 100)
    position = models.CharField(max_length =100)
    start_date = models.DateField()
    end_date =models.DateField()
    placement_status =models.CharField(max_length=100)

    student = models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE,related_name="placements")
    internship_administrator=models.ForeignKey(internship_administrator,on_delete=models.SET_NULL,null=True,blank=True)
    workplace_supervisor=models.ForeignKey(workplace_supervisor, on_delete =models.SET_NULL,null=True,blank=True)
    academic_supervisor =models.ForeignKey(academic_supervisor,on_delete=models.SET_NULL,null=True,blank=True)

    def __str__(self):
        return f"{self.student.student_name} at {self.organization_name}"
    
class logbook_entry(models.Model):
    entry_id = models.AutoField(primary_key =True)
    placement=models.ForeignKey(internship_placement,on_delete =models.CASCADE,related_name ="logbooks")
    week_number = models.IntegerField()
    start_date=models.DateField()
    end_date = models.DateField()
    tasks_done =models.TextField()
    hours_worked =models.DecimalField(max_digits=5,decimal_places=2)
    challenges =models.TextField(default="None")
    logbook_submission_status=models.CharField(max_length=50,default="Draft")
    def __str__(self):
        return f"The log for {self.placement.student.student_name} in {self.week_number}"
    
class evaluation(models.Model):
    evaluation_id =models.AutoField(primary_key=True)
    placement = models.ForeignKey('internship_placement', on_delete =models.CASCADE,related_name='evaluations')
    supervisor = models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE,related_name='submitted_evaluations',null=True,blank=True)
    rating_score =models.IntegerField()
    feedback =models.TextField()
    submission_date =models.DateField(auto_now_add=True)

    def __str__(self):
        return f"FINAL EVALUATION FOR {self.placement.student.student_name}"

class issue(models.Model):
    student = models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    description = models.TextField()
    status = models.CharField(max_length=20,default='Pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
