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
            status='pending',
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
        
        return Response({"status": "success", "job_id": job.id})

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
            from django.utils.dateformat import format
            
            date_str = job.scheduled_at.strftime('%B %d, %Y at %I:%M %p') if job.scheduled_at else 'TBD'
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
            
            # Mock Telegram Integration
            if job.customer.telegram_username:
                print(f"\n[TELEGRAM BOT MOCK]")
                print(f"Sending message to {job.customer.telegram_username}:")
                print(f"🔧 Your FieldFlow repair is scheduled for {date_str} with {tech_name}!\n")

class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer

