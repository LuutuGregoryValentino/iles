import re
from rest_framework import serializers

def validate_strong_password(password):
    """
    to check if password is strong enough
    """
    errors = []
