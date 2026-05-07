"""
emails.py — ILES HTML Email Notifications
All emails are sent as branded HTML with a plain text fallback.
"""

from django.core.mail import EmailMultiAlternatives
from django.conf import settings

PRIMARY  = "#1a3a6b"
GREEN    = "#10b981"
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

def _send(subject, to, html, preview=""):
    if not to:
        return
    try:
        msg = EmailMultiAlternatives(
            subject=f"[ILES] {subject}",
            body=f"{subject}\n\nLog in at {APP_URL}",
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', settings.EMAIL_HOST_USER),
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


# ── 2. ACCOUNT APPROVED — sent to supervisor or admin when approved ───────────

def send_account_approved_email(user):
    html = f"""
    {_h("Your Account Has Been Approved ✓", GREEN)}
    {_sub("An administrator has activated your ILES account.")}
    <p style="font-size:14px;line-height:1.7;color:{MUTED};margin:0 0 20px;">
      Hi <strong style="color:{TEXT};">{user.username}</strong>, your <strong>{user.get_role_display()}</strong>
      account on the ILES platform has been reviewed and approved. You can now log in and access the system.
    </p>
    {_info([("Email address", user.email), ("Role", user.get_role_display()), ("Status", "Approved ✓")])}
    {_box("You now have full access to your dashboard. Log in to get started.", GREEN)}
    {_btn("Log in to ILES", APP_URL, GREEN)}
    """
    _send("Your ILES account has been approved", user.email, html,
          f"Your {user.get_role_display()} account has been approved.")


# ── 3. PLACEMENT ASSIGNED — sent to student and both supervisors ──────────────

def send_placement_assigned_email(placement):
    student    = placement.student
    wp_sup     = placement.workplace_supervisor
    ac_sup     = placement.academic_supervisor

    # Email to student
    student_html = f"""
    {_h("You Have Been Assigned an Internship Placement 🎓")}
    {_sub("Your internship placement details are now available on ILES.")}
    <p style="font-size:14px;line-height:1.7;color:{MUTED};margin:0 0 20px;">
      Hi <strong style="color:{TEXT};">{student.student_name}</strong>,
      your internship placement has been created by your administrator. You can now log in
      and start submitting your weekly logbook entries.
    </p>
    {_info([
        ("Organisation",         placement.organization_name),
        ("Position",             placement.position),
        ("Start date",           str(placement.start_date)),
        ("End date",             str(placement.end_date)),
        ("Workplace supervisor", wp_sup.supervisor_name if wp_sup else "Not assigned yet"),
        ("Academic supervisor",  ac_sup.lecturer_name   if ac_sup else "Not assigned yet"),
        ("Status",               placement.placement_status),
    ])}
    {_box("You are expected to submit a logbook entry every week. Log in to get started.", GREEN)}
    {_btn("View My Placement", APP_URL)}
    """
    _send("Internship Placement Assigned", student.user.email, student_html,
          f"You have been placed at {placement.organization_name}.")

    # Email to workplace supervisor
    if wp_sup and wp_sup.user:
        wp_html = f"""
        {_h("A Student Has Been Assigned to You", AMBER)}
        {_sub("A new student internship placement has been created under your supervision.")}
        <p style="font-size:14px;line-height:1.7;color:{MUTED};margin:0 0 20px;">
          Hi <strong style="color:{TEXT};">{wp_sup.supervisor_name}</strong>,
          a student has been assigned to your workplace supervision on ILES.
        </p>
        {_info([
            ("Student",      student.student_name),
            ("Organisation", placement.organization_name),
            ("Position",     placement.position),
            ("Start date",   str(placement.start_date)),
            ("End date",     str(placement.end_date)),
        ])}
        {_box("You will receive email notifications when the student submits their weekly logbooks.", AMBER)}
        {_btn("Log in to ILES", APP_URL, AMBER)}
        """
        _send(f"New student assigned — {student.student_name}", wp_sup.user.email, wp_html,
              f"{student.student_name} has been assigned to your supervision.")

    # Email to academic supervisor
    if ac_sup and ac_sup.user:
        ac_html = f"""
        {_h("A Student Has Been Assigned to You", PURPLE)}
        {_sub("A new student internship placement has been created under your academic supervision.")}
        <p style="font-size:14px;line-height:1.7;color:{MUTED};margin:0 0 20px;">
          Hi <strong style="color:{TEXT};">{ac_sup.lecturer_name}</strong>,
          you have been assigned as the academic supervisor for a student on ILES.
        </p>
        {_info([
            ("Student",      student.student_name),
            ("Organisation", placement.organization_name),
            ("Position",     placement.position),
            ("Start date",   str(placement.start_date)),
            ("End date",     str(placement.end_date)),
        ])}
        {_btn("Log in to ILES", APP_URL, PURPLE)}
        """
        _send(f"New student assigned — {student.student_name}", ac_sup.user.email, ac_html,
              f"{student.student_name} has been assigned to your academic supervision.")


# ── 4. LOGBOOK SUBMITTED — sent to assigned supervisors ──────────────────────

def send_logbook_submitted_email(logbook):
    placement = logbook.placement
    student   = placement.student
    wp_sup    = placement.workplace_supervisor
    ac_sup    = placement.academic_supervisor

    recipients = []
    if wp_sup and wp_sup.user:
        recipients.append((wp_sup.supervisor_name, wp_sup.user.email))
    if ac_sup and ac_sup.user:
        recipients.append((ac_sup.lecturer_name, ac_sup.user.email))

    for name, email in recipients:
        html = f"""
        {_h("New Logbook Submission", AMBER)}
        {_sub(f"{student.student_name} has submitted their Week {logbook.week_number} logbook for review.")}
        {_info([
            ("Student",      student.student_name),
            ("Organisation", placement.organization_name),
            ("Week number",  f"Week {logbook.week_number}"),
            ("Hours worked", f"{logbook.hours_worked} hours"),
            ("Date range",   f"{logbook.start_date} → {logbook.end_date}"),
        ])}
        {_box(f"<strong>Tasks done:</strong> {logbook.tasks_done[:300]}{'...' if len(logbook.tasks_done) > 300 else ''}", AMBER)}
        {_btn("Review Logbook", APP_URL, AMBER)}
        """
        _send(f"Logbook Submitted — Week {logbook.week_number} | {student.student_name}",
              email, html, f"{student.student_name} submitted Week {logbook.week_number} logbook.")


# ── 5. LOGBOOK APPROVED — sent to student ────────────────────────────────────

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


# ── 6. ISSUE REPORTED — sent to assigned supervisors ─────────────────────────

def send_issue_reported_email(issue):
    placement = issue.placement
    ac_sup    = placement.academic_supervisor if placement else None
    wp_sup    = placement.workplace_supervisor if placement else None

    recipients = []
    if ac_sup and ac_sup.user:
        recipients.append((ac_sup.lecturer_name, ac_sup.user.email))
    if wp_sup and wp_sup.user:
        recipients.append((wp_sup.supervisor_name, wp_sup.user.email))

    for name, email in recipients:
        html = f"""
        {_h("New Issue Reported", RED)}
        {_sub("A student has reported a problem that needs your attention.")}
        {_info([
            ("Student",     issue.student.email),
            ("Issue title", issue.title),
            ("Organisation",placement.organization_name if placement else "—"),
            ("Reported on", str(issue.created_at.strftime('%d %b %Y at %H:%M'))),
            ("Status",      "Pending"),
        ])}
        {_box(f"<strong>Description:</strong> {issue.description}", RED)}
        {_btn("Review This Issue", APP_URL, RED)}
        """
        _send(f"New Issue Reported — {issue.title}", email, html,
              f"A student reported: {issue.title}")


# ── 7. ISSUE RESOLVED — sent to student ──────────────────────────────────────

def send_issue_resolved_email(issue):
    html = f"""
    {_h("Issue Resolved ✓", GREEN)}
    {_sub("Your reported issue has been resolved.")}
    <p style="font-size:14px;line-height:1.7;color:{MUTED};margin:0 0 20px;">
      Hi <strong style="color:{TEXT};">{issue.student.username}</strong>,
      the issue you reported has been reviewed and marked as resolved.
    </p>
    {_info([
        ("Issue title",  issue.title),
        ("Reported on",  str(issue.created_at.strftime('%d %b %Y'))),
        ("Resolved on",  str(issue.updated_at.strftime('%d %b %Y'))),
        ("Status",       "Resolved ✓"),
    ])}
    {_box(issue.supervisor_feedback, GREEN) if issue.supervisor_feedback else ""}
    {_btn("View My Issues", APP_URL, GREEN)}
    """
    _send(f"Issue Resolved — {issue.title}", issue.student.email, html,
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