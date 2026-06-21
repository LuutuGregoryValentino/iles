"""
Django management command to seed the ILES database with sample data.

USAGE:
    python manage.py seed_data
"""

from datetime import date, timedelta
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from iles_models_app.models import (
    Student, InternshipAdministrator,
    WorkplaceSupervisor, AcademicSupervisor,
    InternshipPlacement, PlacementStatus, LogbookEntry, 
    LogStatus, Evaluation, Issue, IssueStatus
)

User = get_user_model()


class Command(BaseCommand):
    help = 'Seeds the database with sample ILES data for development/testing.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING('\n Seeding ILES database \n'))

        # ── 1. USERS ──────────────────────────────────────────────────────────

        greg_user, created = User.objects.get_or_create(
            email='luutugregory@gmail.com',
            defaults=dict(
                username='luutugreg',
                university_id='467389',
                role='student',
                first_name='Greg',
                last_name='Luutu',
            )
        )
        if created:
            greg_user.set_password('Pass1234!')
            greg_user.save()
            self.stdout.write(self.style.SUCCESS('  Created student user: Greg'))
        else:
            self.stdout.write('  Student user already exists — skipping.')

        rahma_user, created = User.objects.get_or_create(
            email='rahmaluutun@gmail.com',
            defaults=dict(
                username='luuturahma',
                university_id='467390',
                role='student',
                first_name='Rahma',
                last_name='Luutu',
            )
        )
        if created:
            rahma_user.set_password('Pass1234!')
            rahma_user.save()
            self.stdout.write(self.style.SUCCESS('  Created student user: Rahma'))

        admin_user, created = User.objects.get_or_create(
            email='snowchildwolf@gmail.com',
            defaults=dict(
                username='snowchild',
                university_id='ADM001',
                role='administrator',
                first_name='Snowchild',
                last_name='Wolf',
                is_approved=True,
            )
        )
        if created:
            admin_user.set_password('Pass1234!')
            admin_user.save()
            self.stdout.write(self.style.SUCCESS('  Created admin user: Snowchild'))

        ac_user, created = User.objects.get_or_create(
            email='raur743@gmail.com',
            defaults=dict(
                username='ac_supervisor',
                university_id='STAFF001',
                role='academic_supervisor',
                first_name='Academic',
                last_name='Supervisor',
                is_approved=True,
            )
        )
        if created:
            ac_user.set_password('Pass1234!')
            ac_user.save()
            self.stdout.write(self.style.SUCCESS('  Created academic supervisor user'))

        wp_user, created = User.objects.get_or_create(
            email='ojambonicholas052@gmail.com',
            defaults=dict(
                username='workplacesupervisor',
                university_id='WP001',
                role='workplace_supervisor',
                first_name='Nicholas',
                last_name='Ojambo',
                is_approved=True,
            )
        )
        if created:
            wp_user.set_password('Pass1234!')
            wp_user.save()
            self.stdout.write(self.style.SUCCESS('  Created workplace supervisor user'))

        # ── 2. PROFILES ───────────────────────────────────────────────────────

        greg_profile, _ = Student.objects.get_or_create(
            user=greg_user,
            defaults=dict(
                student_id='4677889',
                student_name='Luutu Greg',
                course='Bachelor of Science in Software Engineering',
                year_of_study=3,
                semester=1,
            )
        )

        rahma_profile, _ = Student.objects.get_or_create(
            user=rahma_user,
            defaults=dict(
                student_id='4677890',
                student_name='Luutu Rahma',
                course='Bachelor of Science in Computer Science',
                year_of_study=3,
                semester=1,
            )
        )

        admin_profile, created = InternshipAdministrator.objects.get_or_create(
            user=admin_user,
            defaults=dict(
                admin_id='ADM001',
                admin_name='Snowchild Wolf',
                department='School of Computing and Informatics Technology',
            )
        )

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

        ac_supervisor, created = AcademicSupervisor.objects.get_or_create(
            user=ac_user,
            defaults=dict(
                staff_id='STAFF001',
                lecturer_name='Dr. Academic Supervisor',
                college_dept='Department of Information Systems',
                phone_number='+256700000002',
            )
        )

        # ── 3. PLACEMENT ──────────────────────────────────────────────────────

        # Greg's Placement at Google
        greg_placement, _ = InternshipPlacement.objects.get_or_create(
            student=greg_profile,
            organization_name='Google Uganda',
            defaults=dict(
                position='Cloud Engineering Intern',
                start_date=date(2025, 1, 20),
                end_date=date(2025, 5, 20),
                placement_status=PlacementStatus.ACTIVE,
                administrator=admin_profile,
                workplace_supervisor=wp_supervisor,
                academic_supervisor=ac_supervisor,
            )
        )

        # Rahma's Placement at Microsoft
        rahma_placement, _ = InternshipPlacement.objects.get_or_create(
            student=rahma_profile,
            organization_name='Microsoft ADC',
            defaults=dict(
                position='Frontend Development Intern',
                start_date=date(2025, 1, 25),
                end_date=date(2025, 5, 25),
                placement_status=PlacementStatus.ACTIVE,
                administrator=admin_profile,
                workplace_supervisor=wp_supervisor,
                academic_supervisor=ac_supervisor,
            )
        )

        # ── 4. LOGBOOKS ───────────────────────────────────────────────────────

        # Greg: 2 Approved weeks, 1 Submitted
        for wk in [1, 2]:
            LogbookEntry.objects.get_or_create(
                placement=greg_placement, week_number=wk,
                defaults=dict(
                    start_date=date(2025, 1, 20) + timedelta(weeks=wk-1),
                    end_date=date(2025, 1, 24) + timedelta(weeks=wk-1),
                    tasks_done=f"Completed modules for week {wk} and fixed bugs.",
                    hours_worked=40,
                    submission_status=LogStatus.APPROVED
                )
            )
        
        # Rahma: 1 Submitted, 1 Draft
        LogbookEntry.objects.get_or_create(
            placement=rahma_placement, week_number=1,
            defaults=dict(
                start_date=date(2025, 1, 25),
                end_date=date(2025, 1, 30),
                tasks_done="Setting up React components for the dashboard.",
                hours_worked=35,
                submission_status=LogStatus.SUBMITTED
            )
        )

        # ── 5. EVALUATIONS ────────────────────────────────────────────────────

        # Final evaluation for Greg
        Evaluation.objects.get_or_create(
            placement=greg_placement,
            defaults=dict(
                supervisor=wp_user,
                workplace_score=90,
                academic_score=85,
                logbook_score=95,
                feedback="Excellent performance and timely logbook submissions."
            )
        )

        # ── 6. ISSUES ─────────────────────────────────────────────────────────

        # Rahma reports an issue
        Issue.objects.get_or_create(
            student=rahma_user,
            placement=rahma_placement,
            title="Access to internal tools",
            defaults=dict(
                description="I haven't been granted access to the Azure DevOps environment yet.",
                status=IssueStatus.PENDING
            )
        )

        # ── DONE ──────────────────────────────────────────────────────────────

        self.stdout.write(self.style.SUCCESS('\n Full Scenario Seed complete!\n'))
        self.stdout.write(self.style.WARNING(
            f'\nStudents:   {greg_user.email}, {rahma_user.email} / Pass1234!\n'
            f'Admin:      {admin_user.email} / Pass1234!\n'
            f'WP Super:   {wp_user.email} / Pass1234!\n'
            f'AC Super:   {ac_user.email} / Pass1234!\n'
        ))