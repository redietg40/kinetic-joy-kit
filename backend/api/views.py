from rest_framework import viewsets, generics
from rest_framework.permissions import AllowAny
from django.contrib.auth.models import User
from .models import Customer, Technician, Job, Invoice
from .serializers import CustomerSerializer, TechnicianSerializer, JobSerializer, InvoiceSerializer, UserSerializer

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = UserSerializer

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        role = "Owner"
        if Technician.objects.filter(email=user.email).exists():
            role = "Technician"
            name = Technician.objects.get(email=user.email).name
        elif Customer.objects.filter(email=user.email).exists():
            role = "Customer"
            name = Customer.objects.get(email=user.email).name
        else:
            name = user.username

        return Response({
            "id": user.id,
            "email": user.email,
            "name": name,
            "role": role
        })

class BookServiceView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data
        # Create or update customer
        customer, created = Customer.objects.get_or_create(
            email=data.get('email'),
            defaults={
                'id': f"c_{data.get('email')}",
                'name': data.get('name', 'Unknown'),
                'phone': data.get('phone', ''),
                'address': data.get('address', ''),
                'telegram_username': data.get('telegram_username', '')
            }
        )
        if not created and data.get('telegram_username'):
            customer.telegram_username = data.get('telegram_username')
            customer.save()
        # Create unassigned pending job
        import uuid
        job = Job.objects.create(
            id=f"j_{uuid.uuid4().hex[:8]}",
            title=data.get('title', 'Service Request'),
            customer=customer,
            service_type=data.get('service_type', 'General'),
            status='awaiting_payment',
            booking_fee_amount=150.00,
            booking_fee_paid=False,
            priority='medium',
            description=data.get('description', ''),
            address=data.get('address', '')
        )
        
        # Send confirmation email
        from django.core.mail import send_mail
        from django.conf import settings
        
        send_mail(
            "Service Request Received - FieldFlow",
            f"Hi {customer.name},\n\nWe have received your service request for '{job.title}'.\nWe are reviewing it and a technician will schedule your repair shortly!\n\nThanks,\nFieldFlow Team",
            settings.DEFAULT_FROM_EMAIL,
            [customer.email],
            fail_silently=True,
        )
        
        
        # Simulate Chapa Initialize API Response
        checkout_url = f"http://localhost:8080/chapa-checkout?job_id={job.id}&amount=150"
        
        return Response({
            "status": "success", 
            "job_id": job.id,
            "checkout_url": checkout_url,
            "message": "Please complete the booking deposit to confirm your request."
        })

class ChapaWebhookView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        job_id = request.data.get("job_id")
        if not job_id:
            return Response({"error": "Missing job_id"}, status=400)
            
        try:
            job = Job.objects.get(id=job_id)
            if job.status == 'awaiting_payment':
                job.status = 'pending'
                job.booking_fee_paid = True
                import uuid
                job.booking_chapa_tx_ref = f"chapa_tx_{uuid.uuid4().hex[:8]}"
                job.save()
                return Response({"status": "Payment verified, job is now pending."})
            return Response({"status": "Job already processed."})
        except Job.DoesNotExist:
            return Response({"error": "Job not found"}, status=404)

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer

class TechnicianViewSet(viewsets.ModelViewSet):
    queryset = Technician.objects.all()
    serializer_class = TechnicianSerializer

class JobViewSet(viewsets.ModelViewSet):
    queryset = Job.objects.all()
    serializer_class = JobSerializer

    def perform_update(self, serializer):
        old_status = serializer.instance.status
        job = serializer.save()
        
        # If the job just got scheduled, notify the customer!
        if old_status != 'scheduled' and job.status == 'scheduled':
            from django.core.mail import send_mail
            from django.conf import settings
            from django.utils import timezone
            
            if job.scheduled_at:
                local_time = timezone.localtime(job.scheduled_at)
                date_str = local_time.strftime('%B %d, %Y at %I:%M %p')
            else:
                date_str = 'TBD'
            
            tech_name = job.technician.name if job.technician else 'a technician'
            
            subject = f"Your repair has been scheduled! - FieldFlow"
            message = (
                f"Hi {job.customer.name},\n\n"
                f"Great news! Your service request '{job.title}' has been officially scheduled.\n\n"
                f"Date & Time: {date_str}\n"
                f"Technician: {tech_name}\n\n"
                f"If you need to make any changes, please reply to this email.\n\n"
                f"Thank you for choosing FieldFlow!"
            )
            
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [job.customer.email],
                fail_silently=True,
            )
            
            # Real Telegram Integration
            if job.customer.telegram_username:
                username = job.customer.telegram_username.strip('@')
                token = getattr(settings, 'TELEGRAM_BOT_TOKEN', '')
                if token:
                    import urllib.request
                    import json
                    try:
                        # 1. Fetch updates to find the user's chat_id
                        req = urllib.request.Request(f"https://api.telegram.org/bot{token}/getUpdates")
                        with urllib.request.urlopen(req) as response:
                            updates = json.loads(response.read().decode())
                        
                        chat_id = None
                        if updates.get('ok'):
                            for update in updates.get('result', []):
                                message_data = update.get('message', {})
                                from_user = message_data.get('from', {})
                                if from_user.get('username') == username:
                                    chat_id = from_user.get('id')
                                    break
                        
                        if chat_id:
                            # 2. Send the message
                            bot_msg = f"🔧 *FieldFlow Notification*\n\nYour repair '{job.title}' is scheduled for {date_str} with {tech_name}!"
                            send_req = urllib.request.Request(
                                f"https://api.telegram.org/bot{token}/sendMessage",
                                data=json.dumps({"chat_id": chat_id, "text": bot_msg, "parse_mode": "Markdown"}).encode('utf-8'),
                                headers={'Content-Type': 'application/json'}
                            )
                            with urllib.request.urlopen(send_req) as send_resp:
                                print(f"Successfully sent real Telegram message to @{username}!")
                        else:
                            print(f"Could not find chat_id for @{username}. Did they start the bot?")
                    except Exception as e:
                        print(f"Telegram API error: {e}")

class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer

