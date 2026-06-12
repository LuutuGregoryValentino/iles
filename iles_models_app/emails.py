"""
emails.py — ILES HTML Email Notifications
All emails are sent as branded HTML with a plain text fallback.
"""

from django.core.mail import EmailMultiAlternatives
from django.conf import settings

PRIMARY  = "#1a3a6b"
GREEN    = "#10b981"
BLACK    = "#000000"
AMBER    = "#f59e0b"
RED      = "#ef4444"
PURPLE   = "#534AB7"
LIGHT_BG = "#f8fafc"
CARD_BG  = "#ffffff"
TEXT     = "#0f172a"
MUTED    = "#64748b"
BORDER   = "#e2e8f0"
APP_URL  = "https://iles-nine.vercel.app"


def _base(content, preview=""):
    return f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>ILES — Makerere University</title></head>
<body style="margin:0;padding:0;background:{LIGHT_BG};font-family:'Segoe UI',Arial,sans-serif;color:{TEXT};">
<div style="display:none;max-height:0;overflow:hidden;font-size:1px;">{preview}</div>
<table width="100%" cellpadding="0" cellspacing="0" style="background:{LIGHT_BG};padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:{CARD_BG};border-radius:12px;border:1px solid {BORDER};overflow:hidden;">
<tr><td style="background:{PRIMARY};padding:28px 40px;text-align:center;">
  <span style="font-size:24px;font-weight:700;color:#fff;letter-spacing:-0.5px;">ILES</span>
  <p style="margin:6px 0 0;font-size:12px;color:rgba(255,255,255,0.6);letter-spacing:1px;text-transform:uppercase;">Internship Logging &amp; Evaluation System</p>
</td></tr>
<tr><td style="padding:40px;">{content}</td></tr>
<tr><td style="background:{LIGHT_BG};border-top:1px solid {BORDER};padding:24px 40px;text-align:center;">
  <p style="margin:0;font-size:12px;color:{MUTED};">ILES — Makerere University<br/>
  College of Computing &amp; Information Sciences<br/>
  <a href="{APP_URL}" style="color:{PRIMARY};text-decoration:none;">{APP_URL}</a></p>
  <p style="margin:10px 0 0;font-size:11px;color:{BORDER};">If you did not expect this email you can safely ignore it.</p>
</td></tr>
</table></td></tr></table>
</body></html>"""


def _h(text, color=PRIMARY):
    return f'<h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:{color};">{text}</h1>'

def _sub(text):
    return f'<p style="margin:0 0 24px;font-size:14px;color:{MUTED};">{text}</p>'

def _info(rows):
    cells = "".join([
        f'<tr><td style="padding:10px 16px;font-size:13px;color:{MUTED};width:40%;border-bottom:1px solid {BORDER};">{k}</td>'
        f'<td style="padding:10px 16px;font-size:13px;color:{TEXT};font-weight:500;border-bottom:1px solid {BORDER};">{v}</td></tr>'
        for k,v in rows
    ])
    return f'<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid {BORDER};border-radius:8px;overflow:hidden;margin:20px 0;">{cells}</table>'

def _btn(label, url, color=PRIMARY):
    return f'<div style="text-align:center;margin:32px 0;"><a href="{url}" style="display:inline-block;background:{color};color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:14px 32px;border-radius:8px;">{label} &rarr;</a></div>'

def _box(text, color=GREEN):
    return f'<div style="background:{color}11;border-left:4px solid {color};border-radius:6px;padding:14px 18px;margin:20px 0;font-size:14px;color:{TEXT};line-height:1.6;">{text}</div>'

def _info_row(label: str, value: str) -> str:
    return f"""
    <tr>
      <td style="padding:10px 16px;font-size:13px;color:{MUTED};width:40%;border-bottom:1px solid {BORDER};">{label}</td>
      <td style="padding:10px 16px;font-size:13px;color:{BLACK};font-weight:600;border-bottom:1px solid {BORDER};">{value}</td>
    </tr>"""

def _heading(text: str, color: str = BLACK) -> str:
    return f'<h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:{color};">{text}</h1>'


def _subheading(text: str) -> str:
    return f'<p style="margin:0 0 24px;font-size:14px;color:{MUTED};">{text}</p>'

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


def _send(subject: str, to: str, html: str, preview: str = ""):
    """Helper that sends the HTML email with a plain text fallback."""
    if not to:
        return
    try:
        msg = EmailMultiAlternatives(
            subject=f"[ILES] {subject}",
            body=f"{subject}\n\nLog in at {APP_URL}",
            #  get from_email without crashing if settings missing
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', getattr(settings, 'EMAIL_HOST_USER', 'webmaster@localhost')),
            to=[to],
        )
        msg.attach_alternative(_base(html, preview), "text/html")
        msg.send(fail_silently=True)
    except Exception:
        pass


# ── 1. WELCOME EMAIL ──────────────────────────────────────────────────────────

def send_welcome_email(user):
    html = f"""
    {_h("Welcome to ILES! 🎉")}
    {_sub("Your account has been created successfully.")}
    <p style="font-size:14px;line-height:1.7;color:{MUTED};margin:0 0 20px;">
      Hi <strong style="color:{TEXT};">{user.username}</strong>, welcome to the Internship
      Logging &amp; Evaluation System at Makerere University.
    </p>
    {_info([("Email address", user.email), ("University ID", user.university_id), ("Role", user.get_role_display())])}
    {_btn("Log in to ILES", APP_URL)}
    """
    _send("Welcome to ILES — Your account is ready", user.email, html,
          f"Hi {user.username}, your ILES account has been created.")


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
    student = logbook.placement.student
    sup     = logbook.placement.workplace_supervisor
    html = f"""
    {_h("Logbook Approved ✓", GREEN)}
    {_sub(f"Your Week {logbook.week_number} logbook has been reviewed and approved.")}
    <p style="font-size:14px;line-height:1.7;color:{MUTED};margin:0 0 20px;">
      Hi <strong style="color:{TEXT};">{student.student_name}</strong>,
      your Week {logbook.week_number} logbook has been approved by your supervisor.
      This entry is now locked.
    </p>
    {_info([
        ("Week",         f"Week {logbook.week_number}"),
        ("Organisation", logbook.placement.organization_name),
        ("Hours worked", f"{logbook.hours_worked} hours"),
        ("Approved by",  sup.supervisor_name if sup else "Your supervisor"),
        ("Status",       "Approved ✓ — locked permanently"),
    ])}
    {_box("Keep it up! Submit your next weekly logbook on time. 🎉", GREEN)}
    {_btn("View My Logbooks", APP_URL, GREEN)}
    """
    _send(f"Logbook Approved — Week {logbook.week_number}", student.user.email, html,
          f"Your Week {logbook.week_number} logbook has been approved.")


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
    student_name = getattr(issue.student, 'username', issue.student.email)

    recipients = []
    if placement:
        if placement.workplace_supervisor:
            recipients.append((placement.workplace_supervisor.user.email, placement.workplace_supervisor.supervisor_name))
        if placement.academic_supervisor:
            recipients.append((placement.academic_supervisor.user.email, placement.academic_supervisor.lecturer_name))

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
    {_box(issue.supervisor_feedback, GREEN) if issue.supervisor_feedback else ""}
    {_btn("View My Issues", APP_URL, GREEN)}
    """
    _send(f"Issue Resolved — {issue.title}", issue.student.email, content,
          f"Your issue '{issue.title}' has been resolved.")


# ── 8. EVALUATION SUBMITTED — sent to student ────────────────────────────────

def send_evaluation_email(evaluation):
    student = evaluation.placement.student
    grade   = evaluation.grade
    score   = evaluation.total_score
    gc      = {
        "A": GREEN, "B": "#3b82f6", "C": AMBER, "D": "#f97316", "F": RED
    }.get(grade, PRIMARY)

    html = f"""
    {_h("Your Internship Evaluation is Ready", PRIMARY)}
    {_sub("Your supervisor has submitted your final internship evaluation.")}
    <p style="font-size:14px;line-height:1.7;color:{MUTED};margin:0 0 24px;">
      Hi <strong style="color:{TEXT};">{student.student_name}</strong>,
      your internship evaluation has been submitted. Here is your result:
    </p>
    <div style="text-align:center;margin:24px 0;">
      <div style="display:inline-block;background:{gc}11;border:2px solid {gc};border-radius:16px;padding:24px 48px;">
        <div style="font-size:60px;font-weight:800;color:{gc};line-height:1;">{grade}</div>
        <div style="font-size:22px;font-weight:700;color:{gc};margin-top:4px;">{score}%</div>
        <div style="font-size:12px;color:{MUTED};margin-top:4px;text-transform:uppercase;">Final Grade</div>
      </div>
    </div>
    {_info([
        ("Workplace score (40%)", f"{evaluation.workplace_score}/100 → {round(evaluation.workplace_score * 0.4, 1)} pts"),
        ("Academic score (30%)",  f"{evaluation.academic_score}/100 → {round(evaluation.academic_score  * 0.3, 1)} pts"),
        ("Logbook score (30%)",   f"{evaluation.logbook_score}/100 → {round(evaluation.logbook_score   * 0.3, 1)} pts"),
        ("Total score",           f"{score}%"),
        ("Grade",                 grade),
    ])}
    {_box(evaluation.feedback, PRIMARY) if evaluation.feedback else ""}
    {_btn("View Full Scorecard", APP_URL, gc)}
    """
    _send(f"Your Internship Evaluation — Grade {grade} ({score}%)",
          student.user.email, html,
          f"Your internship grade is ready: {grade} ({score}%)")
