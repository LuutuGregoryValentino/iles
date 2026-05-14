"""
emails.py — ILES Professional HTML Email Notifications

Features:
✔ Beautiful responsive HTML emails
✔ Plain-text fallback support
✔ Reusable components
✔ Modern email styling
✔ Notification helpers
✔ Error-safe email sending
✔ Internship workflow notifications
"""

from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from django.utils.html import escape, strip_tags
from django.template.defaultfilters import linebreaksbr
import logging

logger = logging.getLogger(__name__)

# ── Brand Colours ────────────────────────────────────────────────────────────

PRIMARY = "#1a3a6b"
GREEN = "#10b981"
AMBER = "#f59e0b"
RED = "#ef4444"

LIGHT_BG = "#f8fafc"
CARD_BG = "#ffffff"

TEXT = "#0f172a"
MUTED = "#64748b"
BORDER = "#e2e8f0"

APP_URL = "https://iles-nine.vercel.app"
LOGO_TEXT = "ILES"


# ── Helpers ──────────────────────────────────────────────────────────────────

def _fmt_date(dt):
    if not dt:
        return "—"

    try:
        return dt.strftime('%d %b %Y')
    except Exception:
        return str(dt)


def _escape(text):
    return escape(str(text)) if text else "—"


# ── Base Template ────────────────────────────────────────────────────────────

def _base_template(content: str, preview: str = "") -> str:
    return f"""
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>ILES Notification</title>
</head>

<body style="
    margin:0;
    padding:0;
    background:{LIGHT_BG};
    font-family:'Segoe UI',Arial,sans-serif;
    color:{TEXT};
">

<div style="
    display:none;
    max-height:0;
    overflow:hidden;
    opacity:0;
">
    {preview}
</div>

<table width="100%" cellpadding="0" cellspacing="0"
style="padding:30px 15px;background:{LIGHT_BG};">

<tr>
<td align="center">

<table width="650" cellpadding="0" cellspacing="0"
style="
    width:100%;
    max-width:650px;
    background:{CARD_BG};
    border-radius:16px;
    overflow:hidden;
    border:1px solid {BORDER};
">

<!-- HEADER -->

<tr>
<td style="
    background:{PRIMARY};
    padding:35px 40px;
    text-align:center;
">

<h1 style="
    margin:0;
    color:white;
    font-size:28px;
    letter-spacing:-0.5px;
">
    {LOGO_TEXT}
</h1>

<p style="
    margin:8px 0 0;
    color:rgba(255,255,255,0.75);
    font-size:13px;
">
    Internship Logging & Evaluation System
</p>

</td>
</tr>

<!-- BODY -->

<tr>
<td style="padding:40px;">

{content}

</td>
</tr>

<!-- FOOTER -->

<tr>
<td style="
    background:{LIGHT_BG};
    padding:25px 40px;
    border-top:1px solid {BORDER};
    text-align:center;
">

<p style="
    margin:0;
    font-size:12px;
    color:{MUTED};
    line-height:1.7;
">

This email was sent by
<strong>ILES — Makerere University</strong>

<br/>

<a href="{APP_URL}"
style="
    color:{PRIMARY};
    text-decoration:none;
">
    {APP_URL}
</a>

</p>

<p style="
    margin-top:12px;
    font-size:11px;
    color:{MUTED};
">

If you did not expect this email,
you can safely ignore it.

</p>

</td>
</tr>

</table>

</td>
</tr>

</table>

</body>
</html>
"""


# ── Components ───────────────────────────────────────────────────────────────

def _heading(text: str, color: str = PRIMARY):
    return f"""
    <h1 style="
        margin:0 0 12px;
        color:{color};
        font-size:24px;
        font-weight:700;
    ">
        {_escape(text)}
    </h1>
    """


def _subheading(text: str):
    return f"""
    <p style="
        margin:0 0 25px;
        color:{MUTED};
        font-size:15px;
        line-height:1.7;
    ">
        {_escape(text)}
    </p>
    """


def _divider():
    return f"""
    <hr style="
        border:none;
        border-top:1px solid {BORDER};
        margin:30px 0;
    ">
    """


def _badge(text: str, color: str = PRIMARY):
    return f"""
    <span style="
        display:inline-block;
        background:{color}22;
        color:{color};
        padding:6px 14px;
        border-radius:999px;
        font-size:12px;
        font-weight:600;
        margin-bottom:18px;
    ">
        {_escape(text)}
    </span>
    """


def _alert(message: str, color: str = GREEN):
    return f"""
    <div style="
        background:{color}18;
        border-left:4px solid {color};
        padding:16px;
        border-radius:8px;
        margin:25px 0;
        font-size:14px;
        line-height:1.6;
    ">
        {message}
    </div>
    """


def _cta_button(label: str, url: str, color: str = PRIMARY):
    return f"""
    <div style="text-align:center;margin:35px 0;">

    <a href="{url}"
    style="
        display:inline-block;
        background:{color};
        color:white;
        text-decoration:none;
        padding:14px 30px;
        border-radius:10px;
        font-size:14px;
        font-weight:600;
    ">

        {_escape(label)} →

    </a>

    </div>
    """


def _info_row(label: str, value: str):
    return f"""
    <tr>

    <td style="
        padding:12px 16px;
        border-bottom:1px solid {BORDER};
        color:{MUTED};
        font-size:13px;
        width:40%;
    ">
        {_escape(label)}
    </td>

    <td style="
        padding:12px 16px;
        border-bottom:1px solid {BORDER};
        font-size:13px;
        font-weight:500;
        color:{TEXT};
    ">
        {_escape(value)}
    </td>

    </tr>
    """


def _info_table(rows: list):
    html_rows = "".join([
        _info_row(label, value)
        for label, value in rows
    ])

    return f"""
    <table width="100%" cellpadding="0" cellspacing="0"
    style="
        border:1px solid {BORDER};
        border-radius:10px;
        overflow:hidden;
        margin:20px 0;
    ">

    {html_rows}

    </table>
    """


def _greeting(name="User"):
    return f"""
    <p style="
        font-size:15px;
        margin:0 0 20px;
    ">
        Hello <strong>{_escape(name)}</strong>,
    </p>
    """


def _signature():
    return f"""
    <div style="margin-top:35px;">

    <p style="
        margin:0;
        font-size:14px;
        line-height:1.7;
    ">
        Regards,<br>
        <strong>ILES Team</strong>
    </p>

    </div>
    """


# ── Core Send Function ───────────────────────────────────────────────────────

def _send(subject: str, to: str, html: str, preview: str = ""):

    if not to:
        logger.warning("Email not sent: recipient missing.")
        return False

    try:

        full_html = _base_template(html, preview)

        plain_text = strip_tags(full_html)

        message = EmailMultiAlternatives(
            subject=f"[ILES] {subject}",
            body=plain_text,
            from_email=getattr(
                settings,
                'DEFAULT_FROM_EMAIL',
                settings.EMAIL_HOST_USER
            ),
            to=[to]
        )

        message.attach_alternative(full_html, "text/html")

        message.send(fail_silently=False)

        logger.info(f"Email sent successfully to {to}")

        return True

    except Exception as e:
        logger.error(f"Email sending failed: {e}")
        return False


# ── Generic Notification ─────────────────────────────────────────────────────

def send_notification_email(
    *,
    to_email: str,
    subject: str,
    heading: str,
    message: str,
    button_label: str = "Open Dashboard",
    button_url: str = APP_URL,
    badge: str = None,
    badge_color: str = PRIMARY,
):

    badge_html = (
        _badge(badge, badge_color)
        if badge else ""
    )

    html = f"""

    {badge_html}

    {_heading(heading)}

    {_subheading(message)}

    {_cta_button(button_label, button_url)}

    {_signature()}

    """

    return _send(
        subject=subject,
        to=to_email,
        html=html,
        preview=message
    )


# ── Placement Assigned ───────────────────────────────────────────────────────

def send_placement_assigned_email(student, placement):

    html = f"""

    {_badge("Placement Assigned", GREEN)}

    {_greeting(student.student_name)}

    {_heading("Internship Placement Assigned", GREEN)}

    {_subheading(
        "Your internship placement has been assigned successfully."
    )}

    {_info_table([
        ("Organization", placement.organization_name),
        ("Position", placement.position),
        ("Start Date", _fmt_date(placement.start_date)),
        ("End Date", _fmt_date(placement.end_date)),
        ("Status", placement.placement_status),
    ])}

    {_alert(
        "Please review your placement details carefully."
    )}

    {_cta_button(
        "View Placement",
        APP_URL
    )}

    {_signature()}

    """

    return _send(
        subject="Internship Placement Assigned",
        to=student.user.email,
        html=html,
        preview="Your internship placement has been assigned."
    )


# ── Logbook Submitted ────────────────────────────────────────────────────────

def send_logbook_submission_email(student, logbook):

    html = f"""

    {_badge("Logbook Submitted", AMBER)}

    {_greeting(student.student_name)}

    {_heading("Weekly Logbook Submitted")}

    {_subheading(
        "Your weekly logbook was submitted successfully."
    )}

    {_info_table([
        ("Week", logbook.week_number),
        ("Hours Worked", logbook.hours_worked),
        ("Status", logbook.submission_status),
        ("Start Date", _fmt_date(logbook.start_date)),
        ("End Date", _fmt_date(logbook.end_date)),
    ])}

    {_alert(
        "Your supervisor will review the submission soon.",
        AMBER
    )}

    {_cta_button(
        "Open Dashboard",
        APP_URL
    )}

    {_signature()}

    """

    return _send(
        subject="Logbook Submitted",
        to=student.user.email,
        html=html,
        preview="Your logbook has been submitted."
    )


# ── Evaluation Results ───────────────────────────────────────────────────────

def send_evaluation_email(student, evaluation):

    grade_color = GREEN if evaluation.grade in ['A', 'B'] else AMBER

    html = f"""

    {_badge("Evaluation Results", grade_color)}

    {_greeting(student.student_name)}

    {_heading("Evaluation Results Released")}

    {_subheading(
        "Your internship evaluation has been completed."
    )}

    {_info_table([
        ("Workplace Score", f"{evaluation.workplace_score}%"),
        ("Academic Score", f"{evaluation.academic_score}%"),
        ("Logbook Score", f"{evaluation.logbook_score}%"),
        ("Total Score", f"{evaluation.total_score}%"),
        ("Grade", evaluation.grade),
    ])}

    {_alert(
        f"You received grade {evaluation.grade}.",
        grade_color
    )}

    {_cta_button(
        "View Results",
        APP_URL
    )}

    {_signature()}

    """

    return _send(
        subject="Internship Evaluation Results",
        to=student.user.email,
        html=html,
        preview="Your evaluation results are now available."
    )


# ── Issue Update Email ───────────────────────────────────────────────────────

def send_issue_update_email(issue):

    color = {
        'Pending': AMBER,
        'In Review': PRIMARY,
        'Resolved': GREEN,
    }.get(issue.status, PRIMARY)

    html = f"""

    {_badge(f"Issue {issue.status}", color)}

    {_greeting(issue.student.username)}

    {_heading("Issue Status Updated", color)}

    {_subheading(
        "Your submitted issue has been updated."
    )}

    {_info_table([
        ("Issue Title", issue.title),
        ("Current Status", issue.status),
        ("Created", _fmt_date(issue.created_at)),
        ("Updated", _fmt_date(issue.updated_at)),
    ])}

    {_alert(
        linebreaksbr(issue.supervisor_feedback or "No feedback yet."),
        color
    )}

    {_cta_button(
        "View Issue",
        APP_URL
    )}

    {_signature()}

    """

    return _send(
        subject="Issue Status Updated",
        to=issue.student.email,
        html=html,
        preview="Your issue status has been updated."
    )