"""
emails.py — ILES HTML Email Notifications
All emails are sent as HTML with a plain text fallback.
Triggered from views.py on key events.
"""


from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from django.utils.html import escape, strip_tags

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


def _fmt_date(dt):
    """Formats dates safely."""
    if not dt:
        return "—"
    return dt.strftime('%d %b %Y')


def _base_template(content: str, preview: str = "") -> str:
    return f"""
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ILES — Makerere University</title>
</head>

<body style="margin:0;padding:0;background:{LIGHT_BG};
             font-family:'Segoe UI',Arial,sans-serif;color:{TEXT};">

  <!-- Hidden preview -->
  <div style="display:none;max-height:0;overflow:hidden;
              font-size:1px;color:{LIGHT_BG};">
    {preview}
  </div>

  <table width="100%" cellpadding="0" cellspacing="0"
         style="background:{LIGHT_BG};padding:32px 16px;">

    <tr>
      <td align="center">

        <!-- Card -->
        <table width="600" cellpadding="0" cellspacing="0"
          style="max-width:600px;width:100%;background:{CARD_BG};
                 border-radius:12px;border:1px solid {BORDER};
                 overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:{PRIMARY};padding:28px 40px;text-align:center;">

              <div style="display:inline-block;width:40px;height:40px;
                          background:rgba(255,255,255,0.15);
                          border-radius:10px;vertical-align:middle;
                          margin-right:12px;"></div>

              <span style="font-size:22px;font-weight:700;color:#ffffff;
                           letter-spacing:-0.5px;vertical-align:middle;">
                {LOGO_TEXT}
              </span>

              <p style="margin:8px 0 0;font-size:12px;
                        color:rgba(255,255,255,0.6);
                        letter-spacing:1px;text-transform:uppercase;">
                Internship Logging &amp; Evaluation System
              </p>

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
            <td style="background:{LIGHT_BG};
                       border-top:1px solid {BORDER};
                       padding:24px 40px;text-align:center;">

              <p style="margin:0;font-size:12px;color:{MUTED};">
                This email was sent by
                <strong>ILES — Makerere University</strong><br/>
                College of Computing &amp; Information Sciences<br/>

                <a href="{APP_URL}"
                   style="color:{PRIMARY};text-decoration:none;">
                  {APP_URL}
                </a>
              </p>

              <p style="margin:12px 0 0;font-size:11px;color:{BORDER};">
                If you did not expect this email, you can safely ignore it.
                <br/><br/>
                Need help? Contact the internship administrator.
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


def _heading(text: str, color: str = PRIMARY) -> str:
    return f'''
    <h1 style="margin:0 0 8px;
               font-size:22px;
               font-weight:700;
               color:{color};
               letter-spacing:-0.3px;">
      {text}
    </h1>
    '''


def _subheading(text: str) -> str:
    return f'''
    <p style="margin:0 0 24px;
              font-size:14px;
              color:{MUTED};">
      {text}
    </p>
    '''


def _divider() -> str:
    return f'''
    <hr style="border:none;
               border-top:1px solid {BORDER};
               margin:24px 0;" />
    '''


def _info_row(label: str, value: str) -> str:
    return f"""
    <tr>
      <td style="padding:10px 16px;
                 font-size:13px;
                 color:{MUTED};
                 width:40%;
                 border-bottom:1px solid {BORDER};">
        {label}
      </td>

      <td style="padding:10px 16px;
                 font-size:13px;
                 color:{TEXT};
                 font-weight:500;
                 border-bottom:1px solid {BORDER};">
        {value or "—"}
      </td>
    </tr>
    """


def _info_table(rows: list) -> str:
    rows_html = "".join([
        _info_row(label, value)
        for label, value in rows
    ])

    return f"""
    <table width="100%" cellpadding="0" cellspacing="0"
      style="border:1px solid {BORDER};
             border-radius:8px;
             overflow:hidden;
             margin:20px 0;">

      {rows_html}

    </table>
    """


def _cta_button(label: str, url: str, color: str = PRIMARY) -> str:
    return f"""
    <div style="text-align:center;margin:32px 0;">

      <a href="{url}"
         style="display:inline-block;
                background:{color};
                color:#ffffff;
                text-decoration:none;
                font-size:14px;
                font-weight:600;
                padding:14px 32px;
                border-radius:8px;
                letter-spacing:0.2px;">

        {label} &rarr;

      </a>

    </div>
    """


def _badge(text: str, color: str) -> str:
    return f'''
    <span style="display:inline-block;
                 background:{color}22;
                 color:{color};
                 font-size:12px;
                 font-weight:600;
                 padding:3px 10px;
                 border-radius:20px;
                 border:1px solid {color}44;">
      {text}
    </span>
    '''


def _send(subject: str, to: str, html: str, preview: str = ""):
    """Sends HTML email with plain text fallback."""

    if not to:
        return

    try:
        full_html = _base_template(html, preview)

        # Better plain-text fallback
        plain = strip_tags(full_html)

        msg = EmailMultiAlternatives(
            subject=f"[ILES] {subject}",
            body=plain,
            from_email=getattr(
                settings,
                'DEFAULT_FROM_EMAIL',
                settings.EMAIL_HOST_USER
            ),
            to=[to],
        )

        msg.attach_alternative(full_html, "text/html")
        msg.send(fail_silently=True)

    except Exception:
        pass
