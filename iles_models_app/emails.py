"""
emails.py — ILES HTML Email Notifications
All emails are sent as HTML with a plain text fallback.
Triggered from views.py on key events.
"""

from django.core.mail import EmailMultiAlternatives
from django.conf import settings

# ── Brand colours ─────────────────────────────────────────────────────────────
PRIMARY   = "#1a3a6b"
GREEN     = "#10b981"
AMBER     = "#f59e0b"
RED       = "#ef4444"
LIGHT_BG  = "#f8fafc"
CARD_BG   = "#ffffff"
TEXT      = "#0f172a"
MUTED     = "#64748b"
BORDER    = "#e2e8f0"
APP_URL   = "https://iles-nine.vercel.app"
LOGO_TEXT = "ILES"


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
  <table width="100%" cellpadding="0" cellspacing="0" style="background:{LIGHT_BG};padding:32px 16px;">
    <tr><td align="center">

      <!-- Card -->
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:{CARD_BG};border-radius:12px;border:1px solid {BORDER};overflow:hidden;">

        <!-- Header -->
        <tr>
          <td style="background:{PRIMARY};padding:28px 40px;text-align:center;">
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


def _heading(text: str, color: str = PRIMARY) -> str:
    return f'<h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:{color};letter-spacing:-0.3px;">{text}</h1>'


def _subheading(text: str) -> str:
    return f'<p style="margin:0 0 24px;font-size:14px;color:{MUTED};">{text}</p>'


def _divider() -> str:
    return f'<hr style="border:none;border-top:1px solid {BORDER};margin:24px 0;" />'


def _info_row(label: str, value: str) -> str:
    return f"""
    <tr>
      <td style="padding:10px 16px;font-size:13px;color:{MUTED};width:40%;border-bottom:1px solid {BORDER};">{label}</td>
      <td style="padding:10px 16px;font-size:13px;color:{TEXT};font-weight:500;border-bottom:1px solid {BORDER};">{value}</td>
    </tr>"""


def _info_table(rows: list) -> str:
    rows_html = "".join([_info_row(label, value) for label, value in rows])
    return f"""
    <table width="100%" cellpadding="0" cellspacing="0"
      style="border:1px solid {BORDER};border-radius:8px;overflow:hidden;margin:20px 0;">
      {rows_html}
    </table>"""


def _cta_button(label: str, url: str, color: str = PRIMARY) -> str:
    return f"""
    <div style="text-align:center;margin:32px 0;">
      <a href="{url}"
        style="display:inline-block;background:{color};color:#ffffff;text-decoration:none;
               font-size:14px;font-weight:600;padding:14px 32px;border-radius:8px;
               letter-spacing:0.2px;">
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
        full_html = _base_template(html, preview)
        plain     = f"{subject}\n\nLog in at {APP_URL}"
        msg = EmailMultiAlternatives(
            subject    = f"[ILES] {subject}",
            body       = plain,
            from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', settings.EMAIL_HOST_USER),
            to         = [to],
        )
        msg.attach_alternative(full_html, "text/html")
        msg.send(fail_silently=True)
    except Exception:
        pass   # never crash the main request because of an email


# ── 1. WELCOME EMAIL — sent on registration ───────────────────────────────────

def send_welcome_email(user):
    content = f"""
    {_heading("Welcome to ILES! 🎉")}
    {_subheading("Your account has been created successfully.")}

    <p style="font-size:14px;line-height:1.7;color:{MUTED};margin:0 0 20px;">
      Hi <strong style="color:{TEXT};">{user.username}</strong>, welcome to the Internship
      Logging &amp; Evaluation System at Makerere University. Your account is ready and
      you can now log in to get started.
    </p>

    {_info_table([
        ("Email address", user.email),
        ("University ID",  user.university_id),
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


# ── 2. LOGBOOK SUBMITTED — sent to workplace supervisor ───────────────────────

def send_logbook_submitted_email(logbook):
    placement   = logbook.placement
    student     = placement.student
    supervisor  = placement.workplace_supervisor
    if not supervisor or not supervisor.user:
        return
    content = f"""
    {_heading("New Logbook Submission", AMBER)}
    {_subheading(f"A student has submitted their Week {logbook.week_number} logbook for your review.")}

    {_info_table([
        ("Student",        student.student_name),
        ("Organisation",   placement.organization_name),
        ("Week number",    f"Week {logbook.week_number}"),
        ("Hours worked",   f"{logbook.hours_worked} hours"),
        ("Date range",     f"{logbook.start_date} → {logbook.end_date}"),
        ("Status",         "Submitted — awaiting your review"),
    ])}

    <div style="background:{LIGHT_BG};border-left:4px solid {AMBER};border-radius:6px;padding:16px 20px;margin:20px 0;">
      <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:{MUTED};text-transform:uppercase;letter-spacing:.5px;">Tasks done this week</p>
      <p style="margin:0;font-size:14px;color:{TEXT};line-height:1.6;">{logbook.tasks_done[:300]}{'...' if len(logbook.tasks_done) > 300 else ''}</p>
    </div>

    {_cta_button("Review Logbook", APP_URL, AMBER)}

    <p style="font-size:13px;color:{MUTED};text-align:center;margin:0;">
      Log in and go to <strong>Logbook Review</strong> to approve or return this entry.
    </p>
    """
    _send(
        subject = f"Logbook Submitted — Week {logbook.week_number} | {student.student_name}",
        to      = supervisor.user.email,
        html    = content,
        preview = f"{student.student_name} submitted their Week {logbook.week_number} logbook.",
    )


# ── 3. LOGBOOK APPROVED — sent to student ────────────────────────────────────

def send_logbook_approved_email(logbook):
    student    = logbook.placement.student
    supervisor = logbook.placement.workplace_supervisor
    content = f"""
    {_heading("Logbook Approved ✓", GREEN)}
    {_subheading("Great news — your logbook has been reviewed and approved.")}

    <p style="font-size:14px;line-height:1.7;color:{MUTED};margin:0 0 20px;">
      Hi <strong style="color:{TEXT};">{student.student_name}</strong>, your Week {logbook.week_number}
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


# ── 4. EVALUATION SUBMITTED — sent to student ────────────────────────────────

def send_evaluation_email(evaluation):
    student = evaluation.placement.student
    grade   = evaluation.grade
    score   = evaluation.total_score
    grade_colors = {"A": GREEN, "B": "#3b82f6", "C": AMBER, "D": "#f97316", "F": RED}
    grade_color  = grade_colors.get(grade, PRIMARY)

    content = f"""
    {_heading("Your Evaluation is Ready", PRIMARY)}
    {_subheading("Your internship evaluation has been submitted by your supervisor.")}

    <p style="font-size:14px;line-height:1.7;color:{MUTED};margin:0 0 24px;">
      Hi <strong style="color:{TEXT};">{student.student_name}</strong>, your supervisor has
      submitted your final internship evaluation. Here is a summary:
    </p>

    <!-- Grade display -->
    <div style="text-align:center;margin:24px 0;">
      <div style="display:inline-block;background:{grade_color}11;border:2px solid {grade_color};
                  border-radius:16px;padding:24px 40px;">
        <div style="font-size:56px;font-weight:800;color:{grade_color};line-height:1;">{grade}</div>
        <div style="font-size:20px;font-weight:700;color:{grade_color};margin-top:4px;">{score}%</div>
        <div style="font-size:12px;color:{MUTED};margin-top:4px;text-transform:uppercase;letter-spacing:.5px;">Final Grade</div>
      </div>
    </div>

    {_info_table([
        ("Workplace score (40%)", f"{evaluation.workplace_score}/100 → {round(evaluation.workplace_score * 0.4, 1)} pts"),
        ("Academic score (30%)",  f"{evaluation.academic_score}/100  → {round(evaluation.academic_score  * 0.3, 1)} pts"),
        ("Logbook score (30%)",   f"{evaluation.logbook_score}/100   → {round(evaluation.logbook_score   * 0.3, 1)} pts"),
        ("Total score",           f"{score}%"),
        ("Grade",                 grade),
    ])}

    {f'''<div style="background:{LIGHT_BG};border-left:4px solid {PRIMARY};border-radius:6px;padding:16px 20px;margin:20px 0;">
      <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:{MUTED};text-transform:uppercase;letter-spacing:.5px;">Supervisor Feedback</p>
      <p style="margin:0;font-size:14px;color:{TEXT};line-height:1.6;">{evaluation.feedback}</p>
    </div>''' if evaluation.feedback else ''}

    {_cta_button("View Full Scorecard", APP_URL, grade_color)}
    """
    _send(
        subject = f"Your Internship Evaluation — Grade {grade} ({score}%)",
        to      = student.user.email,
        html    = content,
        preview = f"Your internship evaluation is ready. Grade: {grade} ({score}%)",
    )


# ── 5. ISSUE REPORTED — sent to academic supervisor ──────────────────────────

def send_issue_reported_email(issue):
    placement = issue.placement
    if not placement:
        return
    supervisor = placement.academic_supervisor
    if not supervisor or not supervisor.user:
        return
    status_badge = _badge("Pending Review", AMBER)
    content = f"""
    {_heading("New Issue Reported", RED)}
    {_subheading("A student has reported a problem that needs your attention.")}

    {_info_table([
        ("Student",      issue.student.email),
        ("Issue title",  issue.title),
        ("Organisation", placement.organization_name if placement else "—"),
        ("Reported on",  str(issue.created_at.strftime('%d %b %Y at %H:%M'))),
        ("Status",       "Pending"),
    ])}

    <div style="background:#fff7ed;border-left:4px solid {RED};border-radius:6px;padding:16px 20px;margin:20px 0;">
      <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:{MUTED};text-transform:uppercase;letter-spacing:.5px;">Issue Description</p>
      <p style="margin:0;font-size:14px;color:{TEXT};line-height:1.6;">{issue.description}</p>
    </div>

    {_cta_button("Review This Issue", APP_URL, RED)}

    <p style="font-size:13px;color:{MUTED};text-align:center;margin:0;">
      Log in and go to <strong>Issues</strong> to update the status and add your feedback.
    </p>
    """
    _send(
        subject = f"New Issue Reported — {issue.title}",
        to      = supervisor.user.email,
        html    = content,
        preview = f"A student has reported: {issue.title}",
    )


# ── 6. ISSUE RESOLVED — sent to student ──────────────────────────────────────

def send_issue_resolved_email(issue):
    content = f"""
    {_heading("Issue Resolved ✓", GREEN)}
    {_subheading("Your reported issue has been resolved by your supervisor.")}

    <p style="font-size:14px;line-height:1.7;color:{MUTED};margin:0 0 20px;">
      Hi <strong style="color:{TEXT};">{issue.student.username}</strong>, the issue you
      reported has been reviewed and marked as resolved.
    </p>

    {_info_table([
        ("Issue title",  issue.title),
        ("Reported on",  str(issue.created_at.strftime('%d %b %Y'))),
        ("Resolved on",  str(issue.updated_at.strftime('%d %b %Y'))),
        ("Status",       "Resolved ✓"),
    ])}

    {f'''<div style="background:{LIGHT_BG};border-left:4px solid {GREEN};border-radius:6px;padding:16px 20px;margin:20px 0;">
      <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:{MUTED};text-transform:uppercase;letter-spacing:.5px;">Supervisor Response</p>
      <p style="margin:0;font-size:14px;color:{TEXT};line-height:1.6;">{issue.supervisor_feedback}</p>
    </div>''' if issue.supervisor_feedback else ''}

    {_cta_button("View My Issues", APP_URL, GREEN)}
    """
    _send(
        subject = f"Issue Resolved — {issue.title}",
        to      = issue.student.email,
        html    = content,
        preview = f"Your issue '{issue.title}' has been resolved.",
    )