
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from rest_framework.test import APIClient
from rest_framework import status

from .models import (
    Student,
    InternshipPlacement,
    Evaluation
)

User = get_user_model()


# ─────────────────────────────────────────────────────────────
# Helper Functions
# ─────────────────────────────────────────────────────────────

def create_user(
    email='test@test.com',
    password='testpass123',
    role='student',
    university_id='25/U/0001',
    username='testuser'
):
    return User.objects.create_user(
        email=email,
        password=password,
        role=role,
        university_id=university_id,
        username=username
    )


# ─────────────────────────────────────────────────────────────
# AUTHENTICATION TESTS
# ─────────────────────────────────────────────────────────────

class AuthTests(TestCase):

    def setUp(self):
        self.client = APIClient()

    def test_register_student(self):
        """Test successful student registration."""

        res = self.client.post('/api/auth/register/', {
            'email': 'student@test.com',
            'username': 'student1',
            'university_id': '25/U/001',
            'role': 'student',
            'password': 'pass1234'
        })

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn('access', res.data)
        self.assertEqual(res.data['user']['email'], 'student@test.com')

    def test_register_missing_fields(self):
        """Test registration with missing fields."""

        res = self.client.post('/api/auth/register/', {
            'email': 'x@x.com'
        })

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_duplicate_email(self):
        """Test duplicate email registration."""

        create_user()

        res = self.client.post('/api/auth/register/', {
            'email': 'test@test.com',
            'username': 'duplicateuser',
            'university_id': '25/U/999',
            'role': 'student',
            'password': 'pass1234'
        })

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_invalid_role(self):
        """Test invalid role rejection."""

        res = self.client.post('/api/auth/register/', {
            'email': 'bad@test.com',
            'username': 'baduser',
            'university_id': '25/U/888',
            'role': 'invalid_role',
            'password': 'pass1234'
        })

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_valid(self):
        """Test login with valid credentials."""

        create_user()

        res = self.client.post('/api/auth/login/', {
            'email': 'test@test.com',
            'password': 'testpass123'
        })

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('access', res.data)
        self.assertIn('refresh', res.data)

    def test_login_invalid_password(self):
        """Test login with wrong password."""

        create_user()

        res = self.client.post('/api/auth/login/', {
            'email': 'test@test.com',
            'password': 'wrongpassword'
        })

        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_nonexistent_user(self):
        """Test login with nonexistent user."""

        res = self.client.post('/api/auth/login/', {
            'email': 'nouser@test.com',
            'password': 'pass1234'
        })

        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_refresh_token(self):
        """Test JWT refresh token."""

        create_user()

        login = self.client.post('/api/auth/login/', {
            'email': 'test@test.com',
            'password': 'testpass123'
        })

        refresh_token = login.data['refresh']

        res = self.client.post('/api/auth/refresh/', {
            'refresh': refresh_token
        })

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('access', res.data)

    def test_get_current_user_authenticated(self):
        """Test authenticated current user endpoint."""

        user = create_user()

        self.client.force_authenticate(user=user)

        res = self.client.get('/api/auth/me/')

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['email'], user.email)

    def test_get_current_user_unauthenticated(self):
        """Test unauthenticated access."""

        res = self.client.get('/api/auth/me/')

        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


# ─────────────────────────────────────────────────────────────
# STUDENT TESTS
# ─────────────────────────────────────────────────────────────

class StudentTests(TestCase):

    def setUp(self):
        self.client = APIClient()

        self.user = create_user()

        self.client.force_authenticate(user=self.user)

    def test_create_student_profile(self):
        """Test creating student profile."""

        res = self.client.post('/api/students/', {
            'user': self.user.id,
            'student_id': '25/U/001',
            'student_name': 'Test Student',
            'course': 'BSc Computer Science',
            'year_of_study': 2,
            'semester': 1
        })

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_list_students(self):
        """Test retrieving student list."""

        res = self.client.get('/api/students/')

        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_student_requires_auth(self):
        """Test authentication requirement."""

        self.client.force_authenticate(user=None)

        res = self.client.get('/api/students/')

        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_invalid_semester(self):
        """Test invalid semester validation."""

        student = Student(
            user=self.user,
            student_id='25/U/777',
            student_name='Invalid Student',
            course='Computer Science',
            year_of_study=2,
            semester=5
        )

        with self.assertRaises(ValidationError):
            student.full_clean()


# ─────────────────────────────────────────────────────────────
# PLACEMENT TESTS
# ─────────────────────────────────────────────────────────────

class PlacementTests(TestCase):

    def setUp(self):

        self.user = create_user()

        self.student = Student.objects.create(
            user=self.user,
            student_id='25/U/001',
            student_name='John Doe',
            course='Computer Science',
            year_of_study=2,
            semester=1
        )

    def test_invalid_placement_dates(self):
        """Test end date before start date."""

        placement = InternshipPlacement(
            organization_name='Tech Corp',
            position='Intern',
            start_date='2025-06-10',
            end_date='2025-05-01',
            student=self.student
        )

        with self.assertRaises(ValidationError):
            placement.clean()

    def test_valid_placement(self):
        """Test valid internship placement."""

        placement = InternshipPlacement.objects.create(
            organization_name='Tech Corp',
            position='Software Intern',
            start_date='2025-05-01',
            end_date='2025-08-01',
            student=self.student
        )

        self.assertEqual(
            placement.organization_name,
            'Tech Corp'
        )


# ─────────────────────────────────────────────────────────────
# EVALUATION TESTS
# ─────────────────────────────────────────────────────────────

class EvaluationTests(TestCase):

    def setUp(self):

        self.user = create_user()

        self.student = Student.objects.create(
            user=self.user,
            student_id='25/U/002',
            student_name='Jane Doe',
            course='Information Systems',
            year_of_study=3,
            semester=2
        )

        self.placement = InternshipPlacement.objects.create(
            organization_name='Google',
            position='Developer Intern',
            start_date='2025-05-01',
            end_date='2025-08-01',
            student=self.student
        )

    def test_total_score_calculation(self):
        """Test weighted score calculation."""

        evaluation = Evaluation.objects.create(
            placement=self.placement,
            workplace_score=80,
            academic_score=70,
            logbook_score=90,
            feedback='Excellent performance'
        )

        self.assertEqual(evaluation.total_score, 80.0)

    def test_grade_calculation(self):
        """Test automatic grade generation."""

        evaluation = Evaluation.objects.create(
            placement=self.placement,
            workplace_score=85,
            academic_score=80,
            logbook_score=90,
            feedback='Very good work'
        )

        self.assertEqual(evaluation.grade, 'A')
