"""
Django management command to seed the ILES database with sample data.

USAGE:
    python manage.py seed_data
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from iles_models_app.models import (
    Student, InternshipAdministrator,
    WorkplaceSupervisor, AcademicSupervisor,
    InternshipPlacement, PlacementStatus,
)

User = get_user_model()


class Command(BaseCommand):
    help = 'Seeds the database with sample ILES data for development/testing.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING('\n Seeding ILES database \n'))

        # ── 1. USERS ──────────────────────────────────────────────────────────

        student_user, created = User.objects.get_or_create(
            email='gregory@iles.ac.ug',
            defaults=dict(
                username='Gregory',
                university_id='467389',
                role='student',
                first_name='Gregory',
                last_name='Luutu',
            )
        )
        if created:
            student_user.set_password('Pass1234!')
            student_user.save()
            self.stdout.write(self.style.SUCCESS('  Created student user: gregory@iles.ac.ug'))
        else:
            self.stdout.write('  Student user already exists — skipping.')

        admin_user, created = User.objects.get_or_create(
            email='admin@iles.ac.ug',
            defaults=dict(
                username='iles_admin',
                university_id='ADM001',
                role='administrator',
                first_name='Admin',
                last_name='ILES',
            )
        )
        if created:
            admin_user.set_password('Pass1234!')
            admin_user.save()
            self.stdout.write(self.style.SUCCESS('  Created admin user: admin@iles.ac.ug'))
        else:
            self.stdout.write('  Admin user already exists — skipping.')

        wp_user, created = User.objects.get_or_create(
            email='wp.supervisor@company.com',
            defaults=dict(
                username='wp_supervisor',
                university_id='WP001',
                role='workplace_supervisor',
                first_name='Sarah',
                last_name='Nakato',
            )
        )
        if created:
            wp_user.set_password('Pass1234!')
            wp_user.save()
            self.stdout.write(self.style.SUCCESS('  Created workplace supervisor user'))
        else:
            self.stdout.write('  Workplace supervisor user already exists — skipping.')

        ac_user, created = User.objects.get_or_create(
            email='ac.supervisor@mak.ac.ug',
            defaults=dict(
                username='ac_supervisor',
                university_id='STAFF001',
                role='academic_supervisor',
                first_name='Dr. James',
                last_name='Ssekibuule',
            )
        )
        if created:
            ac_user.set_password('Pass1234!')
            ac_user.save()
            self.stdout.write(self.style.SUCCESS('  Created academic supervisor user'))
        else:
            self.stdout.write('  Academic supervisor user already exists — skipping.')

        # ── 2. PROFILES ───────────────────────────────────────────────────────

        student, created = Student.objects.get_or_create(
            user=student_user,
            defaults=dict(
                student_id='4677889',
                student_name='Gregory Luutu',
                course='Bachelor of Science in Information Systems',
                year_of_study=3,
                semester=1,
            )
        )
        if created:
            self.stdout.write(self.style.SUCCESS('  Created Student profile'))
        else:
            self.stdout.write('  Student profile already exists — skipping.')

        admin_profile, created = InternshipAdministrator.objects.get_or_create(
            user=admin_user,
            defaults=dict(
                admin_id='ADM001',
                admin_name='ILES Administrator',
                department='School of Computing and Informatics Technology',
            )
        )
        if created:
            self.stdout.write(self.style.SUCCESS('  Created Administrator profile'))
        else:
            self.stdout.write('  Administrator profile already exists — skipping.')

        wp_supervisor, created = WorkplaceSupervisor.objects.get_or_create(
            user=wp_user,
            defaults=dict(
                supervisor_id='WP001',
                supervisor_name='Sarah Nakato',
                job_title='Senior Software Engineer',
                phone_number='+256700000001',
                department='Engineering',
            )
        )
        if created:
            self.stdout.write(self.style.SUCCESS('  Created Workplace Supervisor profile'))
        else:
            self.stdout.write('  Workplace Supervisor profile already exists — skipping.')

        ac_supervisor, created = AcademicSupervisor.objects.get_or_create(
            user=ac_user,
            defaults=dict(
                staff_id='STAFF001',
                lecturer_name='Dr. James Ssekibuule',
                college_dept='Department of Information Systems',
                phone_number='+256700000002',
            )
        )
        if created:
            self.stdout.write(self.style.SUCCESS('  Created Academic Supervisor profile'))
        else:
            self.stdout.write('  Academic Supervisor profile already exists — skipping.')

        # ── 3. PLACEMENT ──────────────────────────────────────────────────────

        placement, created = InternshipPlacement.objects.get_or_create(
            student=student,
            organization_name='Andela Uganda',
            defaults=dict(
                position='Junior Software Developer Intern',
                start_date='2025-01-20',
                end_date='2025-05-20',
                placement_status=PlacementStatus.ACTIVE,
                administrator=admin_profile,
                workplace_supervisor=wp_supervisor,
                academic_supervisor=ac_supervisor,
            )
        )
        if created:
            self.stdout.write(self.style.SUCCESS('  Created Internship Placement'))
        else:
            self.stdout.write('  Placement already exists — skipping.')

        # ── DONE ──────────────────────────────────────────────────────────────

        self.stdout.write(self.style.SUCCESS('\n Seed complete!\n'))
        self.stdout.write(self.style.WARNING(
            '\nStudent login:      gregory@iles.ac.ug        /  Pass1234!\n'
            'Admin login:        admin@iles.ac.ug          /  Pass1234!\n'
            'WP Supervisor:      wp.supervisor@company.com /  Pass1234!\n'
            'AC Supervisor:      ac.supervisor@mak.ac.ug   /  Pass1234!\n'
        ))