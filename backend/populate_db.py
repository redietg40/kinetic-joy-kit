import os
import django
from datetime import datetime, timedelta
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import Customer, Technician, Job, Invoice

def at(days, hour):
    d = timezone.now() + timedelta(days=days)
    return d.replace(hour=hour, minute=0, second=0, microsecond=0)

def populate():
    # Clear existing data
    Invoice.objects.all().delete()
    Job.objects.all().delete()
    Technician.objects.all().delete()
    Customer.objects.all().delete()

    print("Populating Customers...")
    customer_rows = [
      ["c1","Abel Tesfaye","+251 911 204 550","abel@sunrise.et","Bole Atlas, Addis Ababa","Prefers morning visits"],
      ["c2","Selamawit Bekele","+251 922 611 320","selam@bluebird.et","CMC, Addis Ababa","Gate code 205"],
      ["c3","Yonas Hotel","+251 911 876 430","facilities@yonashotel.et","Kazanchis, Addis Ababa","Commercial account"],
      ["c4","Mimi Grocery","+251 933 105 440","mimi@grocery.et","Sar Bet, Addis Ababa","Call before arrival"],
      ["c5","Noah Apartments","+251 944 892 013","manager@noah.et","Ayat, Addis Ababa","12-unit property"],
      ["c6","Bethlehem School","+251 911 662 381","admin@bethlehem.edu.et","Old Airport, Addis Ababa","Visitor pass required"],
      ["c7","Kaleb Restaurant","+251 922 900 176","hello@kalebrestaurant.et","Megenagna, Addis Ababa","Service entrance at rear"],
      ["c8","Liya Worku","+251 933 511 402","liya@example.com","Lebu, Addis Ababa",""],
    ]
    customers = {}
    for i, (cid, name, phone, email, address, notes) in enumerate(customer_rows):
        c = Customer.objects.create(
            id=cid, name=name, phone=phone, email=email, address=address, notes=notes,
            created_at=at(-60+i*4, 9)
        )
        customers[cid] = c
    
    print("Populating Technicians...")
    technicians_rows = [
      {"id":"t1","name":"Dawit Alemu","phone":"+251 911 220 101","email":"dawit@fieldflow.et","specialty":"HVAC","status":"available"},
      {"id":"t2","name":"Hana Girma","phone":"+251 922 310 411","email":"hana@fieldflow.et","specialty":"Plumbing","status":"on_job"},
      {"id":"t3","name":"Samuel Kebede","phone":"+251 933 901 122","email":"samuel@fieldflow.et","specialty":"Electrical","status":"available"},
      {"id":"t4","name":"Meron Tadesse","phone":"+251 944 431 238","email":"meron@fieldflow.et","specialty":"HVAC","status":"off_duty"},
      {"id":"t5","name":"Nahom Fekadu","phone":"+251 911 881 655","email":"nahom@fieldflow.et","specialty":"Plumbing","status":"available"},
    ]
    technicians = {}
    for t in technicians_rows:
        tech = Technician.objects.create(**t)
        technicians[t["id"]] = tech

    print("Populating Jobs...")
    raw_jobs = [
     ["AC not cooling","c1","t1","HVAC","in_progress",0,9,"urgent","Diagnosing compressor"],
     ["Leaking kitchen sink","c2","t2","Plumbing","scheduled",0,11,"normal",""],
     ["Panel safety inspection","c3","t3","Electrical","scheduled",0,14,"normal",""],
     ["Boiler maintenance","c6","t1","HVAC","scheduled",1,9,"low",""],
     ["Blocked drain","c4","t5","Plumbing","scheduled",1,13,"urgent",""],
     ["Lighting retrofit","c3","t3","Electrical","completed",-1,10,"normal","Replaced 12 fixtures"],
     ["Split unit installation","c5","t4","HVAC","completed",-2,8,"normal","Pressure tested"],
     ["Water pressure check","c8","t2","Plumbing","completed",-3,15,"low","Adjusted regulator"],
     ["Socket replacement","c1","t3","Electrical","completed",-4,11,"normal",""],
     ["Freezer service","c7","t1","HVAC","completed",-5,9,"urgent","Replaced capacitor"],
     ["Bathroom refit","c5","t5","Plumbing","scheduled",2,8,"normal",""],
     ["Generator wiring","c6","t3","Electrical","scheduled",2,13,"urgent",""],
     ["Duct cleaning","c2","t4","HVAC","cancelled",-2,14,"low","Customer rescheduled"],
     ["Pump replacement","c4","t2","Plumbing","scheduled",3,10,"normal",""],
     ["Thermostat upgrade","c8","t1","HVAC","scheduled",4,15,"normal",""],
    ]
    jobs = {}
    for i, j in enumerate(raw_jobs):
        jid = f"J-{1048-i}"
        status = j[4]
        completed_at = at(j[5], j[6]+2) if status == "completed" else None
        job = Job.objects.create(
            id=jid, title=j[0], customer=customers[j[1]], technician=technicians[j[2]],
            service_type=j[3], status=status, scheduled_at=at(j[5], j[6]),
            priority=j[7], technician_notes=j[8], description=f"Service request for {j[0].lower()}.",
            address=customers[j[1]].address, completed_at=completed_at
        )
        jobs[jid] = job

    print("Populating Invoices...")
    invoices_rows = [
     ["INV-0248","J-1043","c3",18500,"paid",-1],["INV-0247","J-1042","c5",32750,"sent",-2],["INV-0246","J-1041","c8",4200,"paid",-3],["INV-0245","J-1040","c1",6800,"overdue",-8],["INV-0244","J-1039","c7",12500,"draft",-5],
    ]
    for id, job_id, customer_id, total, status, day in invoices_rows:
        Invoice.objects.create(
            id=id, job=jobs[job_id], customer=customers[customer_id],
            subtotal=total/1.15, tax=total - (total/1.15), total=total,
            currency="ETB", status=status, payment_method="Chapa", chapa_tx_ref=f"FF-{id}",
            paid_at=at(day+1, 14) if status == "paid" else None
        )
    print("Database populated successfully!")

if __name__ == '__main__':
    populate()
