from django.apps import AppConfig


class IlesModelsAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'iles_models_app'
    verbose_name = "ILES Internship Management System"

    def ready(self):
        """
        This method runs when Django starts.
        Use it to import signals or run startup logic.
        """
        import iles_models_app.signals
