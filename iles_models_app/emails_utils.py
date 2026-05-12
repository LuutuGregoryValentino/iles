from django.core.mail import send_mail
from django.conf import settings

def send_email(subject, recipient_email, message_html):
    """Base email sender."""

    send_mail(
        subject = subject,
        message = '',  # plain text fallback 
        from_email = settings.DEFAULT_FROM_EMAIL,
        recipient_list = [recipient_email],
        html_message = message_html,
        fail_silently = True,  
    )

#INCASE STUDENT IS ASSIGNED A PLACEMENT
#Notifying the student
def notify_student_placement_assigned(student, placement):
    send_email(
        subject = "You've Been Assigned an Internship Placement",
        recipient_email = student.user.email,
        message_html = f"""
        <h3>Hello {student.student_name},</h3>
        <p>You have been assigned an internship placement.</p>
        <ul>
            <li><b>Organisation:</b> {placement.organization_name}</li>
            <li><b>Position:</b> {placement.position}</li>
            <li><b>Start Date:</b> {placement.start_date}</li>
            <li><b>End Date:</b> {placement.end_date}</li>
        </ul>
        <p>Log in to the ILES portal to view full details.</p>
        """
    )
#Notifying workplace_supervisor   
def notify_workplace_supervisor_placement_assigned(placement):
    if not placement.workplace_supervisor:
        return
    supervisor = placement.workplace_supervisor
    send_email(
        subject = "A Student Has Been Assigned to You",
        recipient_email = supervisor.user.email,
        message_html = f"""
        <h3>Hello {supervisor.supervisor_name},</h3>
        <p>A student has been assigned to you for supervision.</p>
        <ul>
            <li><b>Student:</b> {placement.student.student_name}</li>
            <li><b>Position:</b> {placement.position}</li>
            <li><b>Start Date:</b> {placement.start_date}</li>
            <li><b>End Date:</b> {placement.end_date}</li>
        </ul>
        <p>Log in to the ILES portal to view full details.</p>
        """
    )
#Notifying academic_supervisor
def notify_academic_supervisor_placement_assigned(placement):
    if not placement.academic_supervisor:
        return
    supervisor = placement.academic_supervisor
    send_email(
        subject="A Student Has Been Assigned to You for Academic Supervision",
        recipient_email=supervisor.user.email,
        message_html=f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
            <h2 style="color: #2c3e50;">New Student Assigned</h2>
            <p>Hello <strong>{supervisor.lecturer_name}</strong>,</p>
            <p>A student has been assigned to you for academic supervision:</p>
            <table style="width:100%; border-collapse: collapse; margin-top: 10px;">
                <tr style="background:#f2f2f2;">
                    <td style="padding:8px; border:1px solid #ddd;"><strong>Student Name</strong></td>
                    <td style="padding:8px; border:1px solid #ddd;">{placement.student.student_name}</td>
                </tr>
                <tr>
                    <td style="padding:8px; border:1px solid #ddd;"><strong>Organisation</strong></td>
                    <td style="padding:8px; border:1px solid #ddd;">{placement.organization_name}</td>
                </tr>
                <tr style="background:#f2f2f2;">
                    <td style="padding:8px; border:1px solid #ddd;"><strong>Position</strong></td>  
                    <td style="padding:8px; border:1px solid #ddd;">{placement.position}</td>
                </tr>
                <tr>
                    <td style="padding:8px; border:1px solid #ddd;"><strong>Start Date</strong></td>
                    <td style="padding:8px; border:1px solid #ddd;">{placement.start_date}</td>
                </tr>
            </table>
            <p style="margin-top:20px;">Log in to the ILES portal to view the student's profile and track their progress.</p>
            <p style="color:#888; font-size:12px;">This is an automated message from the ILES Portal.</p>
        </div>
        """
    ) 

#NOTIFICATION WHEN LOGBOOK HAS BEEN SUBMITTED  
def notify_supervisors_logbook_submitted(logbook):
    placement = logbook.placement
    student_name = placement.student.student_name

    subject = f"New Logbook Entry — Week {logbook.week_number} from {student_name}"
    message_template = lambda name: f"""
        <h3>Hello {name},</h3>
        <p><b>{student_name}</b> has submitted a logbook entry.</p>
        <ul>
            <li><b>Week:</b> {logbook.week_number}</li>
            <li><b>Period:</b> {logbook.start_date} to {logbook.end_date}</li>
            <li><b>Hours Worked:</b> {logbook.hours_worked}</li>
        </ul>
        <p>Log in to the ILES portal to review and approve it.</p>
    """

    if placement.workplace_supervisor:
        send_email(subject, placement.workplace_supervisor.user.email,
                   message_template(placement.workplace_supervisor.supervisor_name))

    if placement.academic_supervisor:
        send_email(subject, placement.academic_supervisor.user.email,
                   message_template(placement.academic_supervisor.lecturer_name))

#NOTIFICATION WHEN AN ISSUE HAS BEEN SUBMITTED
def notify_supervisors_issue_submitted(issue):
    placement = issue.placement
    if not placement:
        return

    student_name = issue.student.student_profile.student_name
    subject = f"New Issue Submitted — {issue.title}"
    message_template = lambda name: f"""
        <h3>Hello {name},</h3>
        <p>Your student <b>{student_name}</b> has submitted an issue.</p>
        <ul>
            <li><b>Title:</b> {issue.title}</li>
            <li><b>Description:</b> {issue.description}</li>
            <li><b>Status:</b> {issue.get_status_display()}</li>
        </ul>
        <p>Log in to the ILES portal to respond.</p>
    """

    if placement.workplace_supervisor:
        send_email(subject, placement.workplace_supervisor.user.email,
                   message_template(placement.workplace_supervisor.supervisor_name))

    if placement.academic_supervisor:
        send_email(subject,placement.academic_supervisor.user.mail,
                message_template(placement.academic_supervisor.lecturer_name))  

#NOTIFICATION TO STUDENT WHEN GRADED
def notify_student_graded(evaluation):
    student = evaluation.placement.student
    send_email(
        subject="Your Internship Has Been Evaluated!",
        recipient_email=student.user.email,
        message_html=f"""
        <h3>Hello {student.student_name},</h3>
        <p>Your internship evaluation has been submitted.</p>
        <ul>
            <li><b>Workplace Score:</b> {evaluation.workplace_score}/100</li>
            <li><b>Academic Score:</b> {evaluation.academic_score}/100</li>
            <li><b>Logbook Score:</b> {evaluation.logbook_score}/100</li>
            <li><b>Total Score:</b> {evaluation.total_score}%</li>
            <li><b>Grade:</b> {evaluation.grade}</li>
        </ul>
        <p><b>Feedback:</b> {evaluation.feedback}</p>
        <p>Log in to the ILES portal to view your full evaluation.</p>
        """
    )         
#NOTIFICATION WHEN SUPERVISOR OR ADMIN ACCOUNT IS APPROVED
def notify_user_approved(user):
    role_display = user.get_role_display()
    send_email(
        subject = "Your ILES Account Has Been Approved!",
        recipient_email = user.email,
        message_html = f"""
        <h3>Hello {user.get_full_name() or user.username},</h3>
        <p>Your <b>{role_display}</b> account on the ILES portal has been approved.</p>
        <p>You can now log in and access the system.</p>
        <p><a href="http://your-frontend-url/login">Click here to log in</a></p>
        """
    )