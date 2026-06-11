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
 
## MODEL TESTS

class UserModelTests(TestCase):
    """
    Location: iles_models_app/tests.py =class UserModelTests
    Tests: User.save() role logic, __str__, USERNAME_FIELD
    """
 
    def test_student_is_auto_approved(self):
        user = make_user(role="student")
        self.assertTrue(user.is_approved)
 
    def test_supervisor_not_auto_approved(self):
        user = make_user(role="academic_supervisor", email="sup@test.com",
                         university_id="S002", username="sup1")
        self.assertFalse(user.is_approved)
 
    def test_administrator_not_auto_approved(self):
        user = make_user(role="administrator", email="adm@test.com",
                         university_id="A001u", username="adm1")
        self.assertFalse(user.is_approved)
 
    def test_str_format(self):
        user = make_user()
        self.assertIn(user.email, str(user))
 
    def test_username_field_is_email(self):
        self.assertEqual(User.USERNAME_FIELD, "email")
 
 
class InternshipPlacementModelTests(TestCase):
    """
    Location: iles_models_app/tests.py → class InternshipPlacementModelTests
    Tests: clean() date validation, overlap validation
    """
 
    def setUp(self):
        self.user = make_user()
        self.student = make_student_profile(self.user)
 
    def test_end_before_start_raises(self):
        placement = InternshipPlacement(
            organization_name="Org",
            position="Intern",
            start_date=datetime.date(2025, 8, 1),
            end_date=datetime.date(2025, 6, 1),
            student=self.student,
        )
        with self.assertRaises(ValidationError):
            placement.clean()
 
    def test_overlapping_placement_raises(self):
        make_placement(self.student)  # first placement Jun–Aug 2025
        overlap = InternshipPlacement(
            organization_name="Other Org",
            position="Intern",
            start_date=datetime.date(2025, 7, 1),
            end_date=datetime.date(2025, 9, 30),
            student=self.student,
        )
        with self.assertRaises(ValidationError):
            overlap.clean()
 
    def test_valid_placement_no_exception(self):
        p = make_placement(self.student)
        p.clean()  # should not raise
 
 
class LogbookEntryModelTests(TestCase):
    """
    Location: iles_models_app/tests.py → class LogbookEntryModelTests
    Tests: hours validation in clean(), unique_together, save() calls full_clean()
    """
 
    def setUp(self):
        self.user = make_user()
        self.student = make_student_profile(self.user)
        self.placement = make_placement(self.student)
 
    def test_negative_hours_raises(self):
        entry = LogbookEntry(
            placement=self.placement, week_number=1,
            start_date=datetime.date(2025, 6, 1),
            end_date=datetime.date(2025, 6, 7),
            tasks_done="Tasks", hours_worked=Decimal("-1"),
        )
        with self.assertRaises(ValidationError):
            entry.clean()
 
    def test_over_120_hours_raises(self):
        entry = LogbookEntry(
            placement=self.placement, week_number=1,
            start_date=datetime.date(2025, 6, 1),
            end_date=datetime.date(2025, 6, 7),
            tasks_done="Tasks", hours_worked=Decimal("121"),
        )
        with self.assertRaises(ValidationError):
            entry.clean()
 
    def test_valid_hours_no_exception(self):
        entry = LogbookEntry(
            placement=self.placement, week_number=1,
            start_date=datetime.date(2025, 6, 1),
            end_date=datetime.date(2025, 6, 7),
            tasks_done="Tasks", hours_worked=Decimal("40"),
        )
        entry.clean()  # should not raise
 
    def test_duplicate_week_raises(self):
        make_logbook(self.placement, week=1)
        with self.assertRaises(Exception):  # IntegrityError or ValidationError
            make_logbook(self.placement, week=1)
 
 
class EvaluationModelTests(TestCase):
    """
    Location: iles_models_app/tests.py → class EvaluationModelTests
    Tests: total_score property, grade property
    """
 
    def setUp(self):
        self.user = make_user()
        self.student = make_student_profile(self.user)
        self.placement = make_placement(self.student)
 
    def _eval(self, wp, ac, lb):
        sup = make_user(email="s@s.com", role="academic_supervisor",
                        university_id="X99", username="sup99", is_approved=True)
        return Evaluation(
            placement=self.placement, supervisor=sup,
            workplace_score=wp, academic_score=ac,
            logbook_score=lb, feedback="OK",
        )
 
    def test_total_score_formula(self):
        e = self._eval(80, 70, 60)
        self.assertAlmostEqual(e.total_score, 71.0)
 
    def test_grade_A(self):
        self.assertEqual(self._eval(100, 100, 100).grade, "A")
 
    def test_grade_B(self):
        self.assertEqual(self._eval(70, 70, 70).grade, "B")
 
    def test_grade_F(self):
        self.assertEqual(self._eval(30, 30, 30).grade, "F")

 
