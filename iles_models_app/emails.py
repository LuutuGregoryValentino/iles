from django.core.mail import send_mail
from django.conf import settings

def send_welcome_email(user):
    send_mail(
        subject='Welcome to ILES — Makerere University',
        message=f'''
Dear {user.username},

Your account has been created successfully on the ILES platform.

Email: {user.email}
Role: {user.get_role_display()}

You can now log in at https://iles-nine.vercel.app/

ILES — Internship Logging & Evaluation System
Makerere University
        ''',
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=True,
    )

def send_logbook_submitted_email(logbook):
    placement = logbook.placement
    student = placement.student
    supervisor = placement.workplace_supervisor
    if not supervisor:
        return
    send_mail(
        subject=f'Logbook Submitted — Week {logbook.week_number}',
        message=f'''
Dear {supervisor.supervisor_name},

{student.student_name} has submitted their Week {logbook.week_number} logbook for review.

Tasks done: {logbook.tasks_done[:200]}
Hours worked: {logbook.hours_worked}

Please log in to review and approve it.
https://iles-nine.vercel.app/

ILES — Makerere University
        ''',
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[supervisor.user.email],
        fail_silently=True,
    )

def send_logbook_approved_email(logbook):
    student = logbook.placement.student
    send_mail(
        subject=f'Logbook Approved — Week {logbook.week_number}',
        message=f'''
Dear {student.student_name},

Your Week {logbook.week_number} logbook has been approved by your supervisor.

Log in to view your progress:
https://iles-nine.vercel.app/

ILES — Makerere University
        ''',
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[student.user.email],
        fail_silently=True,
    )

def send_evaluation_email(evaluation):
    student = evaluation.placement.student
    send_mail(
        subject='Your Internship Evaluation is Ready',
        message=f'''
Dear {student.student_name},

Your internship evaluation has been submitted.

Total Score: {evaluation.total_score}%
Grade: {evaluation.grade}

Log in to view the full breakdown and supervisor feedback:
https://iles-nine.vercel.app/

ILES — Makerere University
        ''',
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[student.user.email],
        fail_silently=True,
    )

def send_issue_reported_email(issue):
    send_mail(
        subject=f'New Issue Reported — {issue.title}',
        message=f'''
A student has reported a new issue.

Student: {issue.student.email}
Title: {issue.title}
Description: {issue.description}

Log in to review and respond:
https://iles-nine.vercel.app/

ILES — Makerere University
        ''',
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[settings.EMAIL_HOST_USER],
        fail_silently=True,
    )