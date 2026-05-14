from django.apps import AppConfig


class IlesModelsAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name               = 'iles_models_app'
    verbose_name       = "ILES Internship Management System"

    def ready(self):
        """Runs when Django starts — import signals here."""
        pass  # signals.py is empty for now — add signal code here when ready