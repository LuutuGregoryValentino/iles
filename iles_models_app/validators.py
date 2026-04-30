import re
from rest_framework import serializers

def validate_strong_password(password):
    """
    to check if password is strong enough
    """
    errors = []

    if len(password) < 8:
        errors.append("password must be at least 8 characters.")

    if not re.search(r'[A-Z]',password):
       errors.append("must have atleast one uppercase letter.")

    if not re.search(r'[a-z]',password):
        errors.append('must have atleast one lowercase letter')

    if not re.search(r'[0-9]',password):
        errors.append("must have atleast one number 0-9")
