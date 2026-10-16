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

    # 5. Clean up fake users, keeping or creating the main administrator
    fake_users = User.objects.exclude(username__in=['redugetahun21@gmail.com', 'admin'])
    deleted_users_count = fake_users.count()
    fake_users.delete()
    print(f"[-] Deleted {deleted_users_count} test/fake user accounts.")

    # Ensure clean admin account exists
    admin_email = 'redugetahun21@gmail.com'
    admin_user = User.objects.filter(username=admin_email).first()
    if not admin_user:
        admin_user = User.objects.create_superuser(
            username=admin_email,
            email=admin_email,
            password='password123',
            first_name='Rediet Getahun'
        )
        print(f"[+] Created superuser: {admin_email} (password: password123)")
    else:
        admin_user.is_staff = True
        admin_user.is_superuser = True
        admin_user.save()
        print(f"[+] Verified superuser: {admin_email}")

    print("=" * 60)
    print("DATABASE RESET COMPLETE: Clean slate ready for real customers!")
    print("=" * 60)

if __name__ == '__main__':
    reset_all()
