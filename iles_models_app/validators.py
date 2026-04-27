import re
from rest_framework import serializers

def validate_strong_password(password):
    """
    to check if password is strong enough
    """
    errors = []

    if len(password) < 8:
        errors.append("password must be at least 8 characters.")

    if not re.search(r'[A-z]',password):
       errors.append("must have atleast one uppercase letter.")

    if not re.search(r'[a-z]'):
        errors.append('must have atleast one lowercase letter')
    
