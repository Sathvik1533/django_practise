"""
Config package initialization.

This ensures Celery app is loaded when Django starts,
enabling the use of @shared_task decorators in Django apps.
"""
from .celery import app as celery_app

__all__ = ('celery_app',)
