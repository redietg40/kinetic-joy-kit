import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import Customer, Technician, Job, Invoice, ChatMessage, InventoryItem, JobPartUsage

def clear():
    print("Clearing unowned/seeded test data (items without an owner)...")
    Invoice.objects.filter(owner__isnull=True).delete()
    JobPartUsage.objects.filter(job__owner__isnull=True).delete()
    Job.objects.filter(owner__isnull=True).delete()
    Technician.objects.filter(owner__isnull=True).delete()
    Customer.objects.filter(owner__isnull=True).delete()
    InventoryItem.objects.filter(owner__isnull=True).delete()
    ChatMessage.objects.filter(owner__isnull=True).delete()
    print("Done! All unowned demo data removed cleanly.")

if __name__ == '__main__':
    clear()
