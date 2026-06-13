"""
emails.py — ILES HTML Email Notifications
All emails are sent as HTML with a plain text fallback.
Triggered from views.py on key events.
"""

from django.core.mail import EmailMultiAlternatives
from django.contrib.auth import get_user_model
from django.conf import settings
from django.utils import timezone
from apscheduler.schedulers.background import BackgroundScheduler
import logging

# ── Brand colours ─────────────────────────────────────────────────────────────
RED       = "#990000"  # Makerere Red
BLACK     = "#000000"
GREEN     = "#10b981"  # Success Green
PRIMARY   = "#990000"
TEXT      = "#1e293b"
MUTED     = "#64748b"
BORDER    = "#e2e8f0"
LIGHT_BG  = "#f8fafc"
CARD_BG   = "#ffffff"
APP_URL   = "https://iles-nine.vercel.app"
LOGO_TEXT = "ILES Portal"

logger = logging.getLogger(__name__)

# init bckgd scheduler
scheduler = BackgroundScheduler()
scheduler.start()


def _base_template(content: str, preview: str = "") -> str:
    """Wraps any content block in the ILES branded email shell."""
    return f"""
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ILES — Makerere University</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background:{LIGHT_BG};font-family:'Segoe UI',Arial,sans-serif;color:{TEXT};">

  <!-- Preview text (hidden) -->
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:{LIGHT_BG};">{preview}</div>

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:{LIGHT_BG};padding:40px 16px;">
    <tr><td align="center">

      <!-- Card -->
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:{CARD_BG};border-radius:8px;border:1px solid {BORDER};overflow:hidden;box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">

        <!-- Header -->
        <tr>
          <td style="background:{RED};padding:28px 40px;text-align:center;">
            <div style="display:inline-block;width:40px;height:40px;background:rgba(255,255,255,0.15);border-radius:10px;vertical-align:middle;margin-right:12px;"></div>
            <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;vertical-align:middle;">{LOGO_TEXT}</span>
            <p style="margin:8px 0 0;font-size:12px;color:rgba(255,255,255,0.6);letter-spacing:1px;text-transform:uppercase;">Internship Logging &amp; Evaluation System</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            {content}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:{LIGHT_BG};border-top:1px solid {BORDER};padding:24px 40px;text-align:center;">
            <p style="margin:0;font-size:12px;color:{MUTED};">
              This email was sent by <strong>ILES — Makerere University</strong><br/>
              College of Computing &amp; Information Sciences<br/>
              <a href="{APP_URL}" style="color:{PRIMARY};text-decoration:none;">{APP_URL}</a>
            </p>
            <p style="margin:12px 0 0;font-size:11px;color:{BORDER};">
              If you did not expect this email, you can safely ignore it.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
"""


def _heading(text: str, color: str = BLACK) -> str:
    return f'<h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:{color};letter-spacing:-0.3px;">{text}</h1>'


def _subheading(text: str) -> str:
    return f'<p style="margin:0 0 24px;font-size:14px;color:{MUTED};">{text}</p>'


def _divider() -> str:
    return f'<hr style="border:none;border-top:1px solid {BORDER};margin:24px 0;" />'


def _info_row(label: str, value: str) -> str:
    return f"""
    <tr>
      <td style="padding:10px 16px;font-size:13px;color:{MUTED};width:40%;border-bottom:1px solid {BORDER};">{label}</td>
      <td style="padding:10px 16px;font-size:13px;color:{BLACK};font-weight:600;border-bottom:1px solid {BORDER};">{value}</td>
    </tr>"""


def _info_table(rows: list) -> str:
    rows_html = "".join([_info_row(label, value) for label, value in rows])
    return f"""
    <table width="100%" cellpadding="0" cellspacing="0"
      style="border:1px solid {BORDER};border-radius:8px;overflow:hidden;margin:20px 0;">
      {rows_html}
    </table>"""


def _cta_button(label: str, url: str, color: str = RED) -> str:
    return f"""
    <div style="text-align:center;margin:32px 0;">
      <a href="{url}"
        style="display:inline-block;background:{color};color:#ffffff;text-decoration:none;
               font-size:14px;font-weight:600;padding:14px 32px;border-radius:8px;
               letter-spacing:0.2px;box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        {label} &rarr;
      </a>
    </div>"""


def _badge(text: str, color: str) -> str:
    return f'<span style="display:inline-block;background:{color}22;color:{color};font-size:12px;font-weight:600;padding:3px 10px;border-radius:20px;border:1px solid {color}44;">{text}</span>'


def _execute_email_send(subject: str, to: str, html: str, preview: str):
    """The actual worker function that communicates with the SMTP server."""
    try:
        full_html = _base_template(html, preview)
        plain     = f"{subject}\n\nLog in at {APP_URL}"
        msg = EmailMultiAlternatives(
            subject    = f"[ILES] {subject}",
            body       = plain,
            from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', settings.EMAIL_HOST_USER),
            to         = [to],
        )
        msg.attach_alternative(full_html, "text/html")
        # Send without failing silently in the background so we can log errors
        msg.send(fail_silently=False)
    except Exception as e:
        logger.error(f"Background email failure to {to}: {str(e)}")


def _send(subject: str, to: str, html: str, preview: str = ""):
    """
    Dispatches the email to the background scheduler.
    This prevents the API from hanging while waiting for the SMTP server.
    """
    if not to:
        return

    # Schedule the job to run immediately
    scheduler.add_job(_execute_email_send, 'date', run_date=timezone.now(), args=[subject, to, html, preview])


# ── 1. WELCOME EMAIL — sent on registration ───────────────────────────────────

def send_welcome_email(user):
    content = f"""
    {_heading("Welcome to ILES! 🎉", BLACK)}
    {_subheading("Your account has been created successfully.")}

    <p style="font-size:14px;line-height:1.7;color:{MUTED};margin:0 0 20px;">
      Hi <strong style="color:{BLACK};">{user.username}</strong>, welcome to the Internship
      Logging &amp; Evaluation System at Makerere University. Your account is ready and
      you can now log in to get started.
    </p>

    {_info_table([
        ("Email address", user.email),
        ("ID Number",      user.university_id),
        ("Role",           user.get_role_display()),
    ])}

    {_cta_button("Log in to ILES", APP_URL, PRIMARY)}

    <p style="font-size:13px;color:{MUTED};text-align:center;margin:0;">
      If you did not create this account, please contact your administrator immediately.
    </p>
    """
    _send(
        subject = "Welcome to ILES — Your account is ready",
        to      = user.email,
        html    = content,
        preview = f"Hi {user.username}, your ILES account has been created.",
    )


# ── 2. ACCOUNT APPROVED — sent to staff ───────────────────────────────────────

def notify_user_approved(user):
    role_display = user.get_role_display()
    content = f"""
    {_heading("Account Approved ✓", GREEN)}
    {_subheading("Your access to the ILES portal has been granted.")}

    <p style="font-size:14px;line-height:1.7;color:{MUTED};margin:0 0 20px;">
      Hello <strong style="color:{BLACK};">{user.get_full_name() or user.username}</strong>, 
      your account as a <strong>{role_display}</strong> has been reviewed and approved by the administrator.
    </p>

    {_cta_button("Log in to Dashboard", f"{APP_URL}/login", BLACK)}
    """
    _send(
        subject = "Your ILES Account Has Been Approved",
        to      = user.email,
        html    = content,
        preview = f"Your {role_display} account has been approved.",
    )


# ── 3. LOGBOOK SUBMITTED — sent to supervisors ───────────────────────────────

def notify_supervisors_logbook_submitted(logbook):
    placement   = logbook.placement
    student     = placement.student
    
    recipients = []
    if placement.workplace_supervisor:
        recipients.append((placement.workplace_supervisor.user.email, placement.workplace_supervisor.supervisor_name))
    if placement.academic_supervisor:
        recipients.append((placement.academic_supervisor.user.email, placement.academic_supervisor.lecturer_name))

    for email, name in recipients:
        content = f"""
    {_heading("New Logbook Submission", BLACK)}
    {_subheading(f"Student {student.student_name} has submitted their Week {logbook.week_number} logbook.")}

    {_info_table([
        ("Student",        student.student_name),
        ("Week Number",    f"Week {logbook.week_number}"),
        ("Hours Worked",   f"{logbook.hours_worked} hrs"),
        ("Period",         f"{logbook.start_date} to {logbook.end_date}"),
        ("Status",         "Submitted — awaiting your review"),
    ])}

    <div style="background:{LIGHT_BG};border-left:4px solid {RED};border-radius:6px;padding:16px 20px;margin:20px 0;">
      <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:{MUTED};text-transform:uppercase;letter-spacing:.5px;">Tasks done this week</p>
      <p style="margin:0;font-size:14px;color:{BLACK};line-height:1.6;">{logbook.tasks_done[:300]}{'...' if len(logbook.tasks_done) > 300 else ''}</p>
    </div>

    {_cta_button("Review Logbook", APP_URL, BLACK)}
    """
        _send(
            subject = f"Logbook Submitted: Week {logbook.week_number} — {student.student_name}",
            to      = email,
            html    = content,
            preview = f"{student.student_name} submitted Week {logbook.week_number} for review.",
        )


def send_logbook_submitted_email(logbook):
    """Wrapper for backward compatibility in views."""
    notify_supervisors_logbook_submitted(logbook)


# ── 4. LOGBOOK APPROVED — sent to student ────────────────────────────────────

def send_logbook_approved_email(logbook):
    student    = logbook.placement.student
    supervisor = logbook.placement.workplace_supervisor
    content = f"""
    {_heading("Logbook Approved ✓", GREEN)}
    {_subheading("Great news — your logbook has been reviewed and approved.")}

    <p style="font-size:14px;line-height:1.7;color:{MUTED};margin:0 0 20px;">
      Hi <strong style="color:{BLACK};">{student.student_name}</strong>, your Week {logbook.week_number}
      logbook has been approved by your supervisor. This entry is now locked.
    </p>

    {_info_table([
        ("Week",         f"Week {logbook.week_number}"),
        ("Organisation", logbook.placement.organization_name),
        ("Hours worked", f"{logbook.hours_worked} hours"),
        ("Approved by",  supervisor.supervisor_name if supervisor else "Your supervisor"),
        ("Status",       "Approved ✓"),
    ])}

    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;margin:20px 0;text-align:center;">
      <p style="margin:0;font-size:14px;color:#166534;font-weight:500;">
        🎉 Keep it up! Submit your next weekly logbook on time.
      </p>
    </div>

    {_cta_button("View My Logbooks", APP_URL, GREEN)}
    """
    _send(
        subject = f"Logbook Approved — Week {logbook.week_number}",
        to      = student.user.email,
        html    = content,
        preview = f"Your Week {logbook.week_number} logbook has been approved.",
    )


# ── 5. EVALUATION SUBMITTED — sent to student ────────────────────────────────

def notify_student_graded(evaluation):
    student = evaluation.placement.student
    grade   = evaluation.grade
    score   = evaluation.total_score
    grade_colors = {"A": GREEN, "B": "#3b82f6", "C": RED, "D": RED, "F": RED}
    grade_color  = grade_colors.get(grade, BLACK)

    content = f"""
    {_heading("Evaluation Result Ready", BLACK)}
    {_subheading("Your internship evaluation has been submitted by your supervisor.")}

    <p style="font-size:14px;line-height:1.7;color:{MUTED};margin:0 0 24px;">
      Hi <strong style="color:{BLACK};">{student.student_name}</strong>, your supervisor has
      submitted your final internship evaluation. Here is a summary:
    </p>

    <!-- Grade Card -->
    <div style="text-align:center;margin:24px 0;">
      <div style="display:inline-block;background:{grade_color}11;border:2px solid {grade_color};
                  border-radius:16px;padding:24px 40px;">
        <div style="font-size:56px;font-weight:800;color:{grade_color};line-height:1;">{grade}</div>
        <div style="font-size:20px;font-weight:700;color:{grade_color};margin-top:4px;">{score}%</div>
        <div style="font-size:12px;color:{MUTED};margin-top:4px;text-transform:uppercase;letter-spacing:.5px;">Final Grade</div>
      </div>
    </div>

    {_info_table([
        ("Workplace (40%)", f"{evaluation.workplace_score}/100"),
        ("Academic (30%)",  f"{evaluation.academic_score}/100"),
        ("Logbook (30%)",   f"{evaluation.logbook_score}/100"),
        ("Final Score",     f"{score}%"),
        ("Grade",                 grade),
    ])}

    {f'''<div style="background:{LIGHT_BG};border-left:4px solid {RED};border-radius:6px;padding:16px 20px;margin:20px 0;">
      <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:{MUTED};text-transform:uppercase;letter-spacing:.5px;">Supervisor Feedback</p>
      <p style="margin:0;font-size:14px;color:{BLACK};line-height:1.6;">{evaluation.feedback}</p>
    </div>''' if evaluation.feedback else ''}

    {_cta_button("View Full Scorecard", APP_URL, grade_color)}
    """
    _send(
        subject = f"Your Internship Evaluation — Grade {grade} ({score}%)",
        to      = student.user.email,
        html    = content,
        preview = f"Your internship evaluation is ready. Grade: {grade} ({score}%)",
    )

def send_evaluation_email(evaluation):
    """Wrapper for backward compatibility."""
    notify_student_graded(evaluation)


# ── 6. ISSUE REPORTED — sent to supervisors ──────────────────────────

def notify_supervisors_issue_submitted(issue):
    placement = issue.placement
    student_user = issue.student
    student_name = getattr(student_user, 'username', student_user.email)

    # 1. Notify the student confirming receipt of the issue
    student_content = f"""
    {_heading("Issue Received", BLACK)}
    {_subheading("We have received your report and are looking into it.")}
    <p style="font-size:14px;line-height:1.7;color:{MUTED};margin:0 0 20px;">
      Hi <strong style="color:{BLACK};">{student_name}</strong>, thank you for reporting the issue: 
      <strong>{issue.title}</strong>. Our team will review it and get back to you shortly.
    </p>
    {_cta_button("View My Issues", APP_URL, BLACK)}
    """
    _send(
        subject = f"Issue Received: {issue.title}",
        to      = student_user.email,
        html    = student_content,
        preview = f"We have received your report: {issue.title}"
    )

    recipients = []
    if placement:
        if placement.workplace_supervisor:
            recipients.append((placement.workplace_supervisor.user.email, placement.workplace_supervisor.supervisor_name))
        if placement.academic_supervisor:
            recipients.append((placement.academic_supervisor.user.email, placement.academic_supervisor.lecturer_name))
    
    # 2. Fallback to Administrators if no placement exists (student not yet assigned)
    if not recipients:
        User = get_user_model()
        admins = User.objects.filter(role='administrator', is_approved=True)
        for admin in admins:
            recipients.append((admin.email, admin.username or "Administrator"))

    for email, name in recipients:
        content = f"""
    {_heading("Attention: Issue Reported", RED)}
    {_subheading(f"A student has reported a problem via the ILES portal.")}

    {_info_table([
        ("Student",      student_name),
        ("Issue Title",  issue.title),
        ("Organisation", placement.organization_name if placement else "Not assigned"),
        ("Reported on",  issue.created_at.strftime('%d %b %Y')),
        ("Priority",     "High"),
    ])}

    <div style="background:#fff1f2;border-left:4px solid {RED};border-radius:6px;padding:16px 20px;margin:20px 0;">
      <p style="margin:0;font-size:14px;color:{BLACK};line-height:1.6;">{issue.description}</p>
    </div>

    {_cta_button("View Issue Details", APP_URL, BLACK)}
    """
        _send(
            subject = f"Alert: Issue Reported by {student_name}",
            to      = email,
            html    = content,
            preview = f"New issue reported: {issue.title}",
        )


# ── 7. ISSUE RESOLVED — sent to student ──────────────────────────────────────

def send_issue_resolved_email(issue):
    content = f"""
    {_heading("Issue Resolved ✓", GREEN)}
    {_subheading("Your reported issue has been addressed and marked as resolved.")}

    <p style="font-size:14px;line-height:1.7;color:{MUTED};margin:0 0 20px;">
      Hi <strong style="color:{BLACK};">{issue.student.username}</strong>, the issue you
      reported has been reviewed and marked as resolved.
    </p>

    {_info_table([
        ("Issue Title",  issue.title),
        ("Reported on",  str(issue.created_at.strftime('%d %b %Y'))),
        ("Status",       "Resolved ✓"),
    ])}

    {f'''<div style="background:{LIGHT_BG};border-left:4px solid {GREEN};border-radius:6px;padding:16px 20px;margin:20px 0;">
      <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:{MUTED};text-transform:uppercase;letter-spacing:.5px;">Supervisor Response</p>
      <p style="margin:0;font-size:14px;color:{BLACK};line-height:1.6;">{issue.supervisor_feedback}</p>
    </div>''' if issue.supervisor_feedback else ''}

    {_cta_button("View Resolution", APP_URL, BLACK)}
    """
    _send(
        subject = f"Issue Resolved — {issue.title}",
        to      = issue.student.email,
        html    = content,
        preview = f"Resolution found for your issue: {issue.title}",
    )


# ── 8. PLACEMENT ASSIGNED — sent to student & supervisors ───────────────────

def notify_student_placement_assigned(student, placement):
    content = f"""
    {_heading("Placement Assigned!", RED)}
    {_subheading("Details regarding your official internship placement.")}

    {_info_table([
        ("Organisation", placement.organization_name),
        ("Position",     placement.position),
        ("Start Date",   str(placement.start_date)),
        ("End Date",     str(placement.end_date)),
    ])}

    {_cta_button("View My Placement", APP_URL, BLACK)}
    """
    _send(
        subject = "Your Internship Placement Assigned",
        to      = student.user.email,
        html    = content,
        preview = f"You have been assigned to {placement.organization_name}.",
    )

def notify_workplace_supervisor_placement_assigned(placement):
    supervisor = placement.workplace_supervisor
    if not supervisor or not supervisor.user: return
    content = f"""
    {_heading("New Student Assigned", BLACK)}
    {_subheading("A student has been assigned to your supervision.")}

    {_info_table([
        ("Student Name", placement.student.student_name),
        ("Position",     placement.position),
        ("Duration",     f"{placement.start_date} to {placement.end_date}"),
    ])}

    {_cta_button("Manage Supervision", APP_URL, RED)}
    """
    _send(
        subject = f"New Student Supervision — {placement.student.student_name}",
        to      = supervisor.user.email,
        html    = content,
        preview = f"Supervision request for {placement.student.student_name}.",
    )

def notify_academic_supervisor_placement_assigned(placement):
    supervisor = placement.academic_supervisor
    if not supervisor or not supervisor.user: return
    content = f"""
    {_heading("Academic Supervision Task", BLACK)}
    {_subheading("A student has been assigned for academic oversight.")}

    {_info_table([
        ("Student",      placement.student.student_name),
        ("Organisation", placement.organization_name),
        ("Start Date",   str(placement.start_date)),
    ])}

    {_cta_button("Review Student Profile", APP_URL, BLACK)}
    """
    _send(
        subject = f"New Academic Supervision — {placement.student.student_name}",
        to      = supervisor.user.email,
        html    = content,
        preview = f"You are the academic supervisor for {placement.student.student_name}.",
    )