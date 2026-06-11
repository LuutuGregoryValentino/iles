import datetime
from decimal import Decimal
from unittest.mock import patch
 
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient
 
from .models import (
    AcademicSupervisor,
    Evaluation,
    InternshipAdministrator,
    InternshipPlacement,
    Issue,
    IssueStatus,
    LogbookEntry,
    LogStatus,
    PlacementStatus,
    Student,
    WorkplaceSupervisor,
)
 
User = get_user_model()

##SHARED HELPERS

def make_user(
    email="test@iles.com",
    password="Testpass1",
    role="student",
    university_id="25/U/0001",
    username="testuser",
    is_approved=None,
):
    """Create and return a User. is_approved defaults match the model's save() logic."""
    user = User.objects.create_user(
        email=email,
        password=password,
        role=role,
        university_id=university_id,
        username=username,
    )
    if is_approved is not None:
        user.is_approved = is_approved
        user.save()
    return user
 
 
def make_student_profile(user, student_id="S001", name="Alice"):
    return Student.objects.create(
        user=user,
        student_id=student_id,
        student_name=name,
        course="BSc CS",
        year_of_study=2,
        semester=1,
    )
 
 
def make_admin_profile(user, admin_id="A001"):
    return InternshipAdministrator.objects.create(
        user=user, admin_id=admin_id, admin_name="Admin User", department="IT"
    )
 
 
def make_workplace_profile(user, sup_id="WS001"):
    return WorkplaceSupervisor.objects.create(
        user=user,
        supervisor_id=sup_id,
        supervisor_name="Workplace Sup",
        job_title="Manager",
        phone_number="+256700000001",
        department="Engineering",
    )
 
 
def make_academic_profile(user, staff_id="AS001"):
    return AcademicSupervisor.objects.create(
        user=user,
        staff_id=staff_id,
        lecturer_name="Academic Sup",
        college_dept="CICS",
        phone_number="+256700000002",
    )
 
 
def make_placement(student_profile, **kwargs):
    defaults = dict(
        organization_name="Acme Ltd",
        position="Intern",
        start_date=datetime.date(2025, 6, 1),
        end_date=datetime.date(2025, 8, 31),
        student=student_profile,
    )
    defaults.update(kwargs)
    return InternshipPlacement.objects.create(**defaults)
 
 
def make_logbook(placement, week=1, hours=40, status=LogStatus.DRAFT):
    return LogbookEntry.objects.create(
        placement=placement,
        week_number=week,
        start_date=datetime.date(2025, 6, 1),
        end_date=datetime.date(2025, 6, 7),
        tasks_done="Wrote unit tests",
        hours_worked=Decimal(str(hours)),
        challenges="None",
        submission_status=status,
    )
 
 
def make_evaluation(placement, supervisor_user, wp=80, ac=75, lb=70):
    return Evaluation.objects.create(
        placement=placement,
        supervisor=supervisor_user,
        workplace_score=wp,
        academic_score=ac,
        logbook_score=lb,
        feedback="Good work",
    )
 
 
def make_issue(student_user, placement=None):
    return Issue.objects.create(
        student=student_user,
        placement=placement,
        title="Test Issue",
        description="Something is wrong",
    )
 

 
