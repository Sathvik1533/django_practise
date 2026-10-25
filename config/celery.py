"""
Celery configuration for Django E-commerce Logistics Platform.

This module initializes the Celery application and configures it to work
with Django. Tasks are automatically discovered from installed apps.
"""
import os
from celery import Celery

# Set default Django settings module for Celery
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Create Celery application instance
app = Celery('ecommerce_logistics')

# Load configuration from Django settings with CELERY_ namespace
app.config_from_object('django.conf:settings', namespace='CELERY')

# Autodiscover tasks from all installed Django apps
app.autodiscover_tasks()


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    """Debug task to verify Celery worker is functioning."""
    print(f'Request: {self.request!r}')
