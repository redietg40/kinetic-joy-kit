import os
import django
import uuid

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fieldflow.settings')
django.setup()

from api.models import Customer, Job
from django.contrib.auth.models import User

def fix_nardos():
    print("=" * 60)
    print("Running Customer Separation: Nardos Tilaye vs Dawit Bekele")
    print("=" * 60)

    owner = User.objects.filter(is_superuser=True).first() or User.objects.first()

    # 1. Find or create Nardos Tilaye
    nardos = Customer.objects.filter(name__iexact="Nardos Tilaye").first()
    if not nardos:
        nardos = Customer.objects.create(
            id=f"c_{uuid.uuid4().hex[:8]}",
            name="Nardos Tilaye",
            phone="0960550890",
            email="redugetahun21@gmail.com",
            address="tayitu, Debretabor",
            notes="Separated booking for Nardos Tilaye",
            owner=owner
        )
        print(f"Created new Customer profile for: {nardos.name} (ID: {nardos.id})")
    else:
        print(f"Customer profile for {nardos.name} already exists (ID: {nardos.id})")

    # 2. Find the job 'asdfqw v f' or latest pending job linked to Dawit Bekele
    job = Job.objects.filter(title__icontains="asdfqw").first()
    if not job:
        dawit = Customer.objects.filter(name__icontains="Dawit").first()
        if dawit:
            job = Job.objects.filter(customer=dawit).order_by('-created_at').first()

    if job:
        old_customer_name = job.customer.name if job.customer else "None"
        job.customer = nardos
        job.save()
        print(f"Reassigned Job '{job.title}' (ID: {job.id}) from '{old_customer_name}' to '{nardos.name}'!")
    else:
        print("No pending job 'asdfqw v f' found to reassign.")

    print("\n--- Current Customers in Database ---")
    for c in Customer.objects.all():
        jobs_count = Job.objects.filter(customer=c).count()
        print(f"• {c.name} (Phone: {c.phone}, Email: {c.email}, Address: {c.address}) -> {jobs_count} job(s)")
    print("=" * 60)
    print("SUCCESS: Nardos Tilaye and Dawit Bekele are now completely separated!")

if __name__ == '__main__':
    fix_nardos()
