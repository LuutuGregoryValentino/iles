from django.db import models
class student(models.Model):
    student_id = models.CharField(max_length=10,primary_key =True)
    student_name = models.CharField(max_length= 100)
    course = models.CharField(max_length = 100)
    year_of_study = models.IntegerField()
    semester = models.IntegerField()
    def __str__(self):
        return self.student_name
    
class internship_administrator(models.Model):
    admin_id = models.CharField(max_length =20,primary_key =True)
    admin_name = models.CharField(max_length =100)
    admin_email = models.EmailField(max_length =254,unique =True)
    role =models.CharField(max_length =100)
    department = models.CharField(max_length =100)
    def __str__(self):
        return f"{self.admin_name} at {self.department}"
    
class workplace_supervisor(models.Model):
    supervisor_id =models.CharField(max_length=20,primary_key = True)
    supervisor_name = models.CharField(max_length = 100)
    job_title =models.CharField(max_length=100)
    phone_number = models.CharField(max_length =10)
    department =models.CharField(max_length=100)
    def __str__(self):
        return self.supervisor_name
    
class academic_supervisor(models.Model):
    staff_id =models.CharField(max_length =20,primary_key =True)
    lecturers_name =models.CharField(max_length =100)
    college_dept =models.CharField (max_length =100)
    phone_number = models.CharField(max_length =10)
    def __str__(self):
        return self.lecturers_name
    

class internship_placement(models.Model):
    placement_id = models.CharField(max_length=100,primary_key =True)
    organization_name = models.CharField(max_length = 100)
    position = models.CharField(max_length =100)
    start_date = models.DateField()
    end_date =models.DateField()
    placement_status =models.CharField(max_length=100)

    student = models.ForeignKey(student,on_delete=models.CASCADE)
    internship_administrator=models.ForeignKey(internship_administrator,on_delete=models.SET_NULL,null=True)
    workplace_supervisor=models.ForeignKey(workplace_supervisor, on_delete =models.SET_NULL,null=True)
    academic_supervisor =models.ForeignKey(academic_supervisor,on_delete=models.SET_NULL,null=True)

    def __str__(self):
        return f"{self.student.student_name} at {self.organization_name}"
    
class logbook_entry(models.Model):
    entry_id = models.AutoField(primary_key =True)
    placement=models.ForeignKey(internship_placement,on_delete =models.CASCADE)
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
    placement=models.ForeignKey(internship_placement, on_delete =models.CASCADE)
    rating_score =models.IntegerField()
    feedback =models.TextField()
    submission_date =models.DateField(auto_now_add=True)

    def __str__(self):
        return f"FINAL EVALUATION FOR {self.placement.student.student_name}"

