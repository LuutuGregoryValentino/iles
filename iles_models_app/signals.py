from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
import logging
from .models import LogbookEntry, LogStatus
from .emails import notify_supervisors_logbook_submitted

logger = logging.getLogger(__name__)

@receiver(pre_save, sender=LogbookEntry)
def track_logbook_status_change(sender, instance, **kwargs):
    """
    Detects if the submission_status is changing from 'Draft' to 'Submitted'.
    """
    if instance.pk:  # Check if this is an update, not a new creation
        try:
            old_instance = LogbookEntry.objects.get(pk=instance.pk)
            if old_instance.submission_status == LogStatus.DRAFT and \
               instance.submission_status == LogStatus.SUBMITTED:
                # Set a temporary flag on the instance to be used in post_save
                instance._is_transitioning_to_submitted = True
        except LogbookEntry.DoesNotExist:
            pass

@receiver(post_save, sender=LogbookEntry)
def handle_logbook_submission_email(sender, instance, created, **kwargs):
    """
    Instantly fires a Brevo HTTP request upon Logbook creation.
    'created' flag ensures duplicates never fire on re-saves.
    """
    # We only fire if the record is brand new AND submitted immediately.
    if created and instance.submission_status == LogStatus.SUBMITTED:
        logger.info(f"Signal Triggered: New Logbook {instance.id} notification.")
        notify_supervisors_logbook_submitted(instance)