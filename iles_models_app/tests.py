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


#AUTH API TESTS

class RegisterAPITests(TestCase):
    """
    Location: iles_models_app/tests.py =class RegisterAPITests
    Endpoint: POST /api/auth/register/
    """

    def setUp(self):
        self.client = APIClient()

    @patch("iles_models_app.views.send_welcome_email")
    def test_register_student_success(self, mock_email):
        res = self.client.post("/api/auth/register/", {
            "email": "new@test.com", "username": "newuser",
            "university_id": "26/U/100", "role": "student", "password": "Secure1",
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn("access", res.data)
        self.assertIn("refresh", res.data)
        mock_email.assert_called_once()

    @patch("iles_models_app.views.send_welcome_email")
    def test_register_missing_fields_returns_400(self, _):
        res = self.client.post("/api/auth/register/", {"email": "x@x.com"})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    @patch("iles_models_app.views.send_welcome_email")
    def test_register_duplicate_email_returns_400(self, _):
        make_user()
        res = self.client.post("/api/auth/register/", {
            "email": "test@iles.com", "username": "other",
            "university_id": "26/U/999", "role": "student", "password": "Secure1",
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    @patch("iles_models_app.views.send_welcome_email")
    def test_register_duplicate_university_id_returns_400(self, _):
        make_user()
        res = self.client.post("/api/auth/register/", {
            "email": "other@test.com", "username": "other2",
            "university_id": "25/U/0001",  # duplicate
            "role": "student", "password": "Secure1",
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


class LoginAPITests(TestCase):
    """
    Location: iles_models_app/tests.py → class LoginAPITests
    Endpoint: POST /api/auth/login/
    """

    def setUp(self):
        self.client = APIClient()
        self.student = make_user()  # students are auto-approved

    def test_login_valid_credentials(self):
        res = self.client.post("/api/auth/login/", {
            "email": "test@iles.com", "password": "Testpass1",
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("access", res.data)

    def test_login_wrong_password(self):
        res = self.client.post("/api/auth/login/", {
            "email": "test@iles.com", "password": "WrongPass",
        })
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_unknown_user(self):
        res = self.client.post("/api/auth/login/", {
            "email": "ghost@test.com", "password": "Testpass1",
        })
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_missing_fields_returns_400(self):
        res = self.client.post("/api/auth/login/", {})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_unapproved_supervisor_blocked(self):
        sup = make_user(email="sup@test.com", role="academic_supervisor",
                        university_id="S002", username="sup1")
        res = self.client.post("/api/auth/login/", {
            "email": "sup@test.com", "password": "Testpass1",
        })
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_approved_supervisor_can_login(self):
        sup = make_user(email="sup2@test.com", role="academic_supervisor",
                        university_id="S003", username="sup2", is_approved=True)
        res = self.client.post("/api/auth/login/", {
            "email": "sup2@test.com", "password": "Testpass1",
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)


class LogoutAPITests(TestCase):
    """
    Location: iles_models_app/tests.py → class LogoutAPITests
    Endpoint: POST /api/auth/logout/
    """

    def setUp(self):
        self.client = APIClient()
        self.user = make_user()

    def test_logout_with_valid_token(self):
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = str(RefreshToken.for_user(self.user))
        self.client.force_authenticate(user=self.user)
        res = self.client.post("/api/auth/logout/", {"refresh": refresh})
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_logout_with_invalid_token_returns_400(self):
        self.client.force_authenticate(user=self.user)
        res = self.client.post("/api/auth/logout/", {"refresh": "bad_token"})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_logout_requires_auth(self):
        res = self.client.post("/api/auth/logout/", {"refresh": "anything"})
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


class CurrentUserAPITests(TestCase):
    """
    Location: iles_models_app/tests.py → class CurrentUserAPITests
    Endpoint: GET /api/auth/me/
    """

    def setUp(self):
        self.client = APIClient()

    def test_returns_own_data_when_authenticated(self):
        user = make_user()
        self.client.force_authenticate(user=user)
        res = self.client.get("/api/auth/me/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["email"], user.email)

    def test_unauthenticated_returns_401(self):
        res = self.client.get("/api/auth/me/")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

 
 #APROVAL API TESTS
class ApproveUserAPITests(TestCase):
    """
    Location: iles_models_app/tests.py = class ApproveUserAPITests
    Endpoint: PATCH /api/auth/approve/<pk>/
    """

    def setUp(self):
        self.client = APIClient()
        self.admin = make_user(
            email="admin@test.com", role="administrator",
            university_id="ADM001", username="admin1", is_approved=True,
        )
        self.pending_sup = make_user(
            email="pending@test.com", role="academic_supervisor",
            university_id="SUP001", username="sup1",
        )

    def test_admin_can_approve_user(self):
        self.client.force_authenticate(user=self.admin)
        res = self.client.patch(
            f"/api/auth/approve/{self.pending_sup.pk}/", {"is_approved": True}
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.pending_sup.refresh_from_db()
        self.assertTrue(self.pending_sup.is_approved)

    def test_non_admin_cannot_approve(self):
        student = make_user()
        self.client.force_authenticate(user=student)
        res = self.client.patch(
            f"/api/auth/approve/{self.pending_sup.pk}/", {"is_approved": True}
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_unapproved_admin_cannot_approve(self):
        unapproved_admin = make_user(
            email="uadm@test.com", role="administrator",
            university_id="ADM002", username="adm2",
        )
        self.client.force_authenticate(user=unapproved_admin)
        res = self.client.patch(
            f"/api/auth/approve/{self.pending_sup.pk}/", {"is_approved": True}
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_approve_nonexistent_user_returns_404(self):
        self.client.force_authenticate(user=self.admin)
        res = self.client.patch("/api/auth/approve/99999/", {"is_approved": True})
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    @patch("iles_models_app.views.notify_user_approved")
    def test_approval_email_sent_once(self, mock_notify):
        self.client.force_authenticate(user=self.admin)
        self.client.patch(
            f"/api/auth/approve/{self.pending_sup.pk}/", {"is_approved": True}
        )
        mock_notify.assert_called_once_with(self.pending_sup)


class PendingUsersAPITests(TestCase):
    """
    Location: iles_models_app/tests.py → class PendingUsersAPITests
    Endpoint: GET /api/auth/pending/
    """

    def setUp(self):
        self.client = APIClient()
        self.admin = make_user(
            email="admin@test.com", role="administrator",
            university_id="ADM001", username="admin1", is_approved=True,
        )

    def test_admin_sees_pending_users(self):
        make_user(email="pend@test.com", role="academic_supervisor",
                  university_id="S101", username="pend1")
        self.client.force_authenticate(user=self.admin)
        res = self.client.get("/api/auth/pending/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(res.data), 1)

    def test_student_cannot_see_pending(self):
        student = make_user()
        self.client.force_authenticate(user=student)
        res = self.client.get("/api/auth/pending/")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_returns_401(self):
        res = self.client.get("/api/auth/pending/")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

#stuudent profile API tests 
class StudentViewSetTests(TestCase):
    """
    Location: iles_models_app/tests.py =class StudentViewSetTests
    Endpoints: GET/POST /api/students/  or  GET/PUT/PATCH/DELETE /api/students/<pk>/
    """

    def setUp(self):
        self.client = APIClient()
        self.user = make_user()
        self.client.force_authenticate(user=self.user)

    def test_create_student_profile(self):
        res = self.client.post("/api/students/", {
            "user": self.user.id, "student_id": "26/U/001",
            "student_name": "Bob", "course": "BSc IT",
            "year_of_study": 1, "semester": 2,
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_list_only_own_profile_for_student(self):
        make_student_profile(self.user)
        other_user = make_user(email="o@test.com", university_id="O002", username="ou")
        make_student_profile(other_user, student_id="S002", name="Other")
        res = self.client.get("/api/students/")
        self.assertEqual(len(res.data), 1)

    def test_admin_sees_all_students(self):
        make_student_profile(self.user)
        admin = make_user(email="adm@test.com", role="administrator",
                          university_id="ADM01", username="adm", is_approved=True)
        self.client.force_authenticate(user=admin)
        res = self.client.get("/api/students/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        res = self.client.get("/api/students/")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

#placement api test

class PlacementViewSetTests(TestCase):
    """
    Location: iles_models_app/tests.py → class PlacementViewSetTests
    Endpoints: GET/POST /api/placements/  |  GET/PUT/PATCH/DELETE /api/placements/<pk>/
    """

    def setUp(self):
        self.client = APIClient()
        self.admin = make_user(
            email="admin@test.com", role="administrator",
            university_id="ADM001", username="admin1", is_approved=True,
        )
        self.student_user = make_user()
        self.student_profile = make_student_profile(self.student_user)

    @patch("iles_models_app.views.notify_student_placement_assigned")
    @patch("iles_models_app.views.notify_workplace_supervisor_placement_assigned")
    @patch("iles_models_app.views.notify_academic_supervisor_placement_assigned")
    def test_create_placement(self, *mocks):
        self.client.force_authenticate(user=self.admin)
        res = self.client.post("/api/placements/", {
            "organization_name": "BigCorp",
            "position": "Dev Intern",
            "start_date": "2025-06-01",
            "end_date": "2025-08-31",
            "student": self.student_profile.id,
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_student_sees_only_own_placements(self):
        make_placement(self.student_profile)
        other_user = make_user(email="o@test.com", university_id="OO99", username="ou")
        other_student = make_student_profile(other_user, student_id="S999")
        make_placement(other_student)

        self.client.force_authenticate(user=self.student_user)
        res = self.client.get("/api/placements/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)

    def test_invalid_date_range_returns_400(self):
        self.client.force_authenticate(user=self.admin)
        res = self.client.post("/api/placements/", {
            "organization_name": "Org",
            "position": "Intern",
            "start_date": "2025-09-01",
            "end_date": "2025-06-01",   # end before start
            "student": self.student_profile.id,
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_unauthenticated_returns_401(self):
        res = self.client.get("/api/placements/")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

#logbook API tests


class LogbookListAPITests(TestCase):
    """
    Location: iles_models_app/tests.py → class LogbookListAPITests
    Endpoint: GET/POST /api/logbooks/
    """

    def setUp(self):
        self.client = APIClient()
        self.student_user = make_user()
        self.student = make_student_profile(self.student_user)
        self.placement = make_placement(self.student)

    def test_student_can_create_logbook(self):
        self.client.force_authenticate(user=self.student_user)
        res = self.client.post("/api/logbooks/", {
            "placement": self.placement.id,
            "week_number": 1,
            "start_date": "2025-06-01",
            "end_date": "2025-06-07",
            "tasks_done": "Set up dev environment",
            "hours_worked": "40.00",
            "challenges": "None",
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_student_only_sees_own_logbooks(self):
        make_logbook(self.placement, week=1)
        other_user = make_user(email="o@test.com", university_id="OO1", username="ou")
        other_st = make_student_profile(other_user, student_id="S999")
        other_pl = make_placement(other_st)
        make_logbook(other_pl, week=1)

        self.client.force_authenticate(user=self.student_user)
        res = self.client.get("/api/logbooks/")
        self.assertEqual(len(res.data), 1)

    def test_unauthenticated_returns_401(self):
        res = self.client.get("/api/logbooks/")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


class LogbookDetailAPITests(TestCase):
    """
    Location: iles_models_app/tests.py = class LogbookDetailAPITests
    Endpoint: GET/PATCH /api/logbooks/<pk>/
    """

    def setUp(self):
        self.client = APIClient()
        self.student_user = make_user()
        self.student = make_student_profile(self.student_user)
        self.placement = make_placement(self.student)
        self.logbook = make_logbook(self.placement)
        self.supervisor = make_user(
            email="sup@test.com", role="academic_supervisor",
            university_id="SUP1", username="sup1", is_approved=True,
        )

    def test_get_logbook_detail(self):
        self.client.force_authenticate(user=self.student_user)
        res = self.client.get(f"/api/logbooks/{self.logbook.pk}/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["week_number"], self.logbook.week_number)

    def test_get_nonexistent_logbook_returns_404(self):
        self.client.force_authenticate(user=self.student_user)
        res = self.client.get("/api/logbooks/99999/")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    @patch("iles_models_app.views.notify_supervisors_logbook_submitted")
    def test_student_can_submit_logbook(self, mock_notify):
        self.client.force_authenticate(user=self.student_user)
        res = self.client.patch(
            f"/api/logbooks/{self.logbook.pk}/",
            {"submission_status": LogStatus.SUBMITTED},
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        mock_notify.assert_called_once()

    @patch("iles_models_app.views.send_logbook_approved_email")
    def test_supervisor_can_approve_logbook(self, mock_email):
        self.logbook.submission_status = LogStatus.SUBMITTED
        self.logbook.save()
        self.client.force_authenticate(user=self.supervisor)
        res = self.client.patch(
            f"/api/logbooks/{self.logbook.pk}/",
            {"submission_status": LogStatus.APPROVED},
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        mock_email.assert_called_once()

    def test_student_cannot_approve_logbook(self):
        self.client.force_authenticate(user=self.student_user)
        res = self.client.patch(
            f"/api/logbooks/{self.logbook.pk}/",
            {"submission_status": LogStatus.APPROVED},
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_approved_logbook_cannot_be_edited(self):
        self.logbook.submission_status = LogStatus.APPROVED
        self.logbook.save()
        self.client.force_authenticate(user=self.supervisor)
        res = self.client.patch(
            f"/api/logbooks/{self.logbook.pk}/",
            {"tasks_done": "Changed tasks"},
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

# EVALUATION API TESTS

class EvaluationListAPITests(TestCase):
    """
    Location: iles_models_app/tests.py = class EvaluationListAPITests
    Endpoint: GET/POST /api/evaluations/
    """

    def setUp(self):
        self.client = APIClient()
        self.supervisor = make_user(
            email="sup@test.com", role="academic_supervisor",
            university_id="SUP1", username="sup1", is_approved=True,
        )
        self.student_user = make_user()
        self.student = make_student_profile(self.student_user)
        self.placement = make_placement(self.student)

    @patch("iles_models_app.views.notify_student_graded")
    def test_supervisor_can_create_evaluation(self, mock_notify):
        self.client.force_authenticate(user=self.supervisor)
        res = self.client.post("/api/evaluations/", {
            "placement": self.placement.id,
            "workplace_score": 80,
            "academic_score": 75,
            "logbook_score": 70,
            "feedback": "Great effort",
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        mock_notify.assert_called_once()

    def test_student_cannot_create_evaluation(self):
        self.client.force_authenticate(user=self.student_user)
        res = self.client.post("/api/evaluations/", {
            "placement": self.placement.id,
            "workplace_score": 80,
            "academic_score": 75,
            "logbook_score": 70,
            "feedback": "Self-eval",
        })
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_student_sees_only_own_evaluations(self):
        make_evaluation(self.placement, self.supervisor)
        other_user = make_user(email="o@test.com", university_id="OO1", username="ou")
        other_st = make_student_profile(other_user, student_id="S999")
        other_pl = make_placement(other_st)
        make_evaluation(other_pl, self.supervisor)

        self.client.force_authenticate(user=self.student_user)
        res = self.client.get("/api/evaluations/")
        self.assertEqual(len(res.data), 1)

    @patch("iles_models_app.views.notify_student_graded")
    def test_duplicate_evaluation_returns_400(self, _):
        make_evaluation(self.placement, self.supervisor)
        self.client.force_authenticate(user=self.supervisor)
        res = self.client.post("/api/evaluations/", {
            "placement": self.placement.id,
            "workplace_score": 70,
            "academic_score": 70,
            "logbook_score": 70,
            "feedback": "Duplicate",
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


class EvaluationDetailAPITests(TestCase):
    """
    Location: iles_models_app/tests.py → class EvaluationDetailAPITests
    Endpoint: GET /api/evaluations/<pk>/
    """

    def setUp(self):
        self.client = APIClient()
        self.supervisor = make_user(
            email="sup@test.com", role="academic_supervisor",
            university_id="SUP1", username="sup1", is_approved=True,
        )
        self.student_user = make_user()
        self.student = make_student_profile(self.student_user)
        self.placement = make_placement(self.student)
        self.evaluation = make_evaluation(self.placement, self.supervisor)

    def test_get_evaluation_detail(self):
        self.client.force_authenticate(user=self.supervisor)
        res = self.client.get(f"/api/evaluations/{self.evaluation.pk}/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_evaluation_response_includes_grade_and_total(self):
        self.client.force_authenticate(user=self.supervisor)
        res = self.client.get(f"/api/evaluations/{self.evaluation.pk}/")
        self.assertIn("total_score", res.data)
        self.assertIn("grade", res.data)

    def test_nonexistent_evaluation_returns_404(self):
        self.client.force_authenticate(user=self.supervisor)
        res = self.client.get("/api/evaluations/99999/")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)


# SUPERVISOR & ADMIN LIST API TESTS

class SupervisorListAPITests(TestCase):
    """
    Location: iles_models_app/tests.py → class SupervisorListAPITests
    Endpoint: GET/POST /api/supervisors/
    """

    def setUp(self):
        self.client = APIClient()
        self.user = make_user()
        self.client.force_authenticate(user=self.user)
        self.wp_user = make_user(
            email="wp@test.com", role="workplace_supervisor",
            university_id="WP01", username="wp1", is_approved=True,
        )

    def test_list_supervisors(self):
        make_workplace_profile(self.wp_user)
        res = self.client.get("/api/supervisors/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIsInstance(res.data, list)

    def test_create_supervisor_profile(self):
        res = self.client.post("/api/supervisors/", {
            "user": self.wp_user.id,
            "supervisor_id": "WS002",
            "supervisor_name": "New Sup",
            "job_title": "Engineer",
            "phone_number": "+256700000099",
            "department": "R&D",
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        res = self.client.get("/api/supervisors/")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


class AdminListAPITests(TestCase):
    """
    Location: iles_models_app/tests.py → class AdminListAPITests
    Endpoint: GET/POST /api/admins/
    """

    def setUp(self):
        self.client = APIClient()
        self.admin_user = make_user(
            email="admin@test.com", role="administrator",
            university_id="ADM001", username="admin1", is_approved=True,
        )
        self.client.force_authenticate(user=self.admin_user)

    def test_list_admins(self):
        make_admin_profile(self.admin_user)
        res = self.client.get("/api/admins/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_create_admin_profile(self):
        res = self.client.post("/api/admins/", {
            "user": self.admin_user.id,
            "admin_id": "ADM099",
            "admin_name": "New Admin",
            "department": "Registry",
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        res = self.client.get("/api/admins/")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

