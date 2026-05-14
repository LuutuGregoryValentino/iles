import re
from rest_framework import serializers

def validate_strong_password(password):
    """
    Checks password strength and raises a ValidationError listing all
    failures at once so the user knows exactly what to fix.
    """
    errors = []

    if len(password) < 8:
        errors.append("Password must be at least 8 characters.")

    if not re.search(r'[A-Z]', password):
        errors.append("Password must contain at least one uppercase letter.")

    if not re.search(r'[a-z]', password):
        errors.append("Password must contain at least one lowercase letter.")

    if not re.search(r'[0-9]', password):
        errors.append("Password must contain at least one number (0–9).")

    if errors:
        raise serializers.ValidationError(errors)