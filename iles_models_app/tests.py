from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()


def create_user(email='test@test.com', password='testpass123', role='student',
                university_id='25/U/0001', username='testuser'):
    return User.objects.create_user(
        email = email, password=password, role=role,
        university_id=university_id, username=username
    )


class AuthTests(TestCase):

    def setUp(self):
        self.client = APIClient()

    def test_register_student(self):
        res = self.client.post('/api/auth/register/', {
            'email': 'student@test.com', 'username': 'student1',
            'university_id': '25/U/001', 'role': 'student', 'password': 'pass1234'
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn('access', res.data)

    def test_register_missing_fields(self):
        res = self.client.post('/api/auth/register/', {'email': 'x@x.com'})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_valid(self):
        create_user()
        res = self.client.post('/api/auth/login/', {
            'email': 'test@test.com', 'password': 'testpass123'
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('access', res.data)

    def test_login_invalid_password(self):
        create_user()
        res = self.client.post('/api/auth/login/', {
            'email': 'test@test.com', 'password': 'wrongpassword'
        })
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_nonexistent_user(self):
        res = self.client.post('/api/auth/login/', {
            'email': 'nobody@test.com', 'password': 'pass1234'
        })
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_current_user_authenticated(self):
        user = create_user()
        self.client.force_authenticate(user=user)
        res = self.client.get('/api/auth/me/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['email'], user.email)

    def test_get_current_user_unauthenticated(self):
        res = self.client.get('/api/auth/me/')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


class StudentTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.user   = create_user()
        self.client.force_authenticate(user=self.user)

    def test_create_student_profile(self):
        res = self.client.post('/api/students/', {
            'user': self.user.id, 'student_id': '25/U/001',
            'student_name': 'Test Student', 'course': 'BSc Computer Science',
            'year_of_study': 2, 'semester': 1
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_list_students(self):
        res = self.client.get('/api/students/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIsInstance(res.data, list)

    def test_student_requires_auth(self):
        self.client.force_authenticate(user=None)
        res = self.client.get('/api/students/')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
