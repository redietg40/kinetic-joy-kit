import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Customer, Technician, Job, Invoice, ChatMessage, InventoryItem, JobPartUsage

def reset_all():
    print("=" * 60)
    print("RESETS ALL FAKE & DEMO DATA FROM FIELDFLOW DATABASE")
    print("=" * 60)

    # 1. Clear transactional records
    inv_count, _ = Invoice.objects.all().delete()
    print(f"[-] Deleted {inv_count} invoices.")

    part_count, _ = JobPartUsage.objects.all().delete()
    print(f"[-] Deleted {part_count} job part usages.")

    job_count, _ = Job.objects.all().delete()
    print(f"[-] Deleted {job_count} jobs.")

    msg_count, _ = ChatMessage.objects.all().delete()
    print(f"[-] Deleted {msg_count} chat messages.")

    # 2. Clear customer profiles
    cust_count, _ = Customer.objects.all().delete()
    print(f"[-] Deleted {cust_count} customer records.")

    # 3. Clear technician profiles
    tech_count, _ = Technician.objects.all().delete()
    print(f"[-] Deleted {tech_count} technician records.")

    # 4. Clear inventory items
    inv_item_count, _ = InventoryItem.objects.all().delete()
    print(f"[-] Deleted {inv_item_count} inventory items.")

    # 5. Clean up all user accounts so you can register fresh as Business Owner
    deleted_users_count, _ = User.objects.all().delete()
    print(f"[-] Deleted all {deleted_users_count} user accounts.")

    print("=" * 60)
    print("DATABASE IS NOW 100% EMPTY: You can now Sign Up fresh as Business Owner!")
    print("=" * 60)

if __name__ == '__main__':
    reset_all()
