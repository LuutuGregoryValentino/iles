import datetime
from decimal import Decimal
from unittest.mock import patch
 
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient
 
from .models import (
    AcademicSupervisor,
    Evaluation,
    InternshipAdministrator,
    InternshipPlacement,
    Issue,
    IssueStatus,
    LogbookEntry,
    LogStatus,
    PlacementStatus,
    Student,
    WorkplaceSupervisor,
)
 
User = get_user_model()
 
