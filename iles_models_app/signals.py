from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User, Issue, LogbookEntry, LogStatus
from .emails import (
    send_welcome_email,
    notify_supervisors_issue_submitted,
    notify_supervisors_logbook_submitted,
    notify_student_logbook_submitted,
    send_logbook_approved_email,
)

@receiver(post_save, sender=User)
def handle_user_created(sender, instance, created, **kwargs):
    if created:
        send_welcome_email(instance)

@receiver(post_save, sender=Issue)
def handle_issue_created(sender, instance, created, **kwargs):
    if created:
        notify_supervisors_issue_submitted(instance)

@receiver(post_save, sender=LogbookEntry)
def handle_logbook_update(sender, instance, **kwargs):
    # Triggered when status is set to SUBMITTED
    if instance.submission_status == LogStatus.SUBMITTED:
        notify_student_logbook_submitted(instance)
        notify_supervisors_logbook_submitted(instance)
    
    # Triggered when status is set to APPROVED
    elif instance.submission_status == LogStatus.APPROVED:
        send_logbook_approved_email(instance)