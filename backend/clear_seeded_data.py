import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from reset_all_data import reset_all

if __name__ == '__main__':
    reset_all()
