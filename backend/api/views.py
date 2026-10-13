from rest_framework import viewsets, generics, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth.models import User
from .models import Customer, Technician, Job, Invoice
from django.conf import settings
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
            if user.first_name and user.first_name.strip():
                name = user.first_name.strip()
            elif user.last_name and user.last_name.strip():
                name = f"{user.first_name} {user.last_name}".strip()
            else:
                # Format friendly display name from email prefix, e.g. 'getahunredu149' -> 'Getahun Redu'
                clean = user.username.split('@')[0]
                import re
                parts = re.findall(r'[a-zA-Z]+', clean)
                name = ' '.join(p.capitalize() for p in parts) if parts else clean

        return Response({
            "id": user.id,
            "email": user.email,
            "name": name,
            "role": role
        })

    def patch(self, request):
        user = request.user
        new_name = request.data.get('name')
        if new_name and new_name.strip():
            user.first_name = new_name.strip()
            user.save()
        return self.get(request)

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
        # Assign owner
        owner = User.objects.filter(is_superuser=True).first() or User.objects.first()
        customer.owner = owner
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
            address=data.get('address', ''),
            owner=owner
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
        checkout_url = f"/chapa-checkout?job_id={job.id}&amount=150"
        
        return Response({
            "status": "success", 
            "job_id": job.id,
            "checkout_url": checkout_url,
            "message": "Please complete the booking deposit to confirm your request."
        })

class CustomerPortalLookupView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        if not email:
            return Response({"error": "Email is required"}, status=400)
        
        customer = Customer.objects.filter(email__iexact=email).first()
        if not customer:
            return Response({"found": False, "message": "No customer found with that email address."}, status=404)
        
        serializer = CustomerSerializer(customer)
        jobs = Job.objects.filter(customer=customer).order_by('-scheduled_at')
        job_serializer = JobSerializer(jobs, many=True)
        invoices = Invoice.objects.filter(customer=customer).order_by('-issued_at')
        invoice_serializer = InvoiceSerializer(invoices, many=True)
        
        return Response({
            "found": True,
            "customer": serializer.data,
            "jobs": job_serializer.data,
            "invoices": invoice_serializer.data
        })

class ChapaWebhookView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        job_id = request.data.get("job_id")
        invoice_id = request.data.get("invoice_id")
        
        if invoice_id:
            try:
                invoice = Invoice.objects.get(id=invoice_id)
                if invoice.status != 'paid':
                    invoice.status = 'paid'
                    from django.utils import timezone
                    invoice.paid_at = timezone.now()
                    invoice.save()
                    return Response({"status": "Invoice payment verified."})
                return Response({"status": "Invoice already paid."})
            except Invoice.DoesNotExist:
                return Response({"error": "Invoice not found"}, status=404)
                
        if not job_id:
            return Response({"error": "Missing job_id or invoice_id"}, status=400)
            
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
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Customer.objects.none()
        if user.is_superuser:
            return Customer.objects.all()
        return Customer.objects.filter(owner=user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

class TechnicianViewSet(viewsets.ModelViewSet):
    queryset = Technician.objects.all()
    serializer_class = TechnicianSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Technician.objects.none()
        if user.is_superuser:
            return Technician.objects.all()
        return Technician.objects.filter(owner=user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

class JobViewSet(viewsets.ModelViewSet):
    queryset = Job.objects.all()
    serializer_class = JobSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Job.objects.none()
        if user.is_superuser:
            return Job.objects.all()
        return (Job.objects.filter(owner=user) | Job.objects.filter(technician__email=user.email)).distinct()

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def perform_update(self, serializer):
        old_status = serializer.instance.status
        old_scheduled_at = serializer.instance.scheduled_at
        
        job = serializer.save()
        
        is_newly_scheduled = (old_status != 'scheduled' and job.status == 'scheduled')
        is_rescheduled = (job.status == 'scheduled' and old_scheduled_at != job.scheduled_at)
        
        # If the job just got scheduled OR rescheduled, notify the customer!
        if is_newly_scheduled or is_rescheduled:
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
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Invoice.objects.none()
        if user.is_superuser:
            return Invoice.objects.all()
        return Invoice.objects.filter(owner=user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=True, methods=['post'])
    def send_telegram(self, request, pk=None):
        invoice = self.get_object()
        customer = invoice.customer
        
        if not customer.telegram_username:
            return Response({"error": "Customer has no Telegram username"}, status=status.HTTP_400_BAD_REQUEST)
            
        username = customer.telegram_username.strip('@')
        token = getattr(settings, 'TELEGRAM_BOT_TOKEN', '')
        
        if not token:
            return Response({"error": "Telegram bot not configured"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        import urllib.request
        import json
        
        try:
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
                bot_msg = f"🧾 *FieldFlow Invoice*\n\nHere is your receipt for your repair:\n*Invoice ID:* {invoice.id}\n*Subtotal:* {invoice.subtotal} ETB\n*Total Paid/Due:* {invoice.total} ETB\n\nThank you for choosing FieldFlow Services!"
                
                image_data_b64 = request.data.get('image_data')
                
                if image_data_b64 and image_data_b64.startswith('data:image'):
                    # Extract the base64 string
                    header, b64_str = image_data_b64.split(',', 1)
                    import base64
                    image_bytes = base64.b64decode(b64_str)
                    
                    # Create multipart form data request
                    import mimetypes
                    import uuid
                    boundary = uuid.uuid4().hex
                    
                    body = bytearray()
                    # Add chat_id
                    body.extend(f'--{boundary}\r\nContent-Disposition: form-data; name="chat_id"\r\n\r\n{chat_id}\r\n'.encode('utf-8'))
                    # Add caption
                    body.extend(f'--{boundary}\r\nContent-Disposition: form-data; name="caption"\r\n\r\n{bot_msg}\r\n'.encode('utf-8'))
                    # Add parse_mode
                    body.extend(f'--{boundary}\r\nContent-Disposition: form-data; name="parse_mode"\r\n\r\nMarkdown\r\n'.encode('utf-8'))
                    
                    # Add inline keyboard button for Chapa checkout
                    checkout_url = f"http://127.0.0.1.nip.io:8080/chapa-checkout?invoice_id={invoice.id}&amount={invoice.total}"
                    reply_markup = json.dumps({"inline_keyboard": [[{"text": "💳 Pay via Chapa", "url": checkout_url}]]})
                    body.extend(f'--{boundary}\r\nContent-Disposition: form-data; name="reply_markup"\r\n\r\n{reply_markup}\r\n'.encode('utf-8'))
                    
                    # Add photo
                    body.extend(f'--{boundary}\r\nContent-Disposition: form-data; name="photo"; filename="invoice.png"\r\nContent-Type: image/png\r\n\r\n'.encode('utf-8'))
                    body.extend(image_bytes)
                    body.extend(f'\r\n--{boundary}--\r\n'.encode('utf-8'))
                    
                    send_req = urllib.request.Request(
                        f"https://api.telegram.org/bot{token}/sendPhoto",
                        data=body,
                        headers={'Content-Type': f'multipart/form-data; boundary={boundary}'}
                    )
                else:
                    send_req = urllib.request.Request(
                        f"https://api.telegram.org/bot{token}/sendMessage",
                        data=json.dumps({"chat_id": chat_id, "text": bot_msg, "parse_mode": "Markdown"}).encode('utf-8'),
                        headers={'Content-Type': 'application/json'}
                    )
                
                with urllib.request.urlopen(send_req) as send_resp:
                    return Response({"status": "Sent successfully via Telegram!"})
            else:
                return Response({"error": f"Could not find chat_id for @{username}. Have they started the bot?"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": f"Telegram API error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

from .models import ChatMessage, InventoryItem, JobPartUsage
from .serializers import ChatMessageSerializer, InventoryItemSerializer, JobPartUsageSerializer

class ChatMessageViewSet(viewsets.ModelViewSet):
    queryset = ChatMessage.objects.all()
    serializer_class = ChatMessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return ChatMessage.objects.none()
        if user.is_superuser:
            return ChatMessage.objects.all()
        return ChatMessage.objects.filter(owner=user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

class InventoryItemViewSet(viewsets.ModelViewSet):
    queryset = InventoryItem.objects.all()
    serializer_class = InventoryItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return InventoryItem.objects.none()
        if user.is_superuser:
            return InventoryItem.objects.all()
        return InventoryItem.objects.filter(owner=user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

class JobPartUsageViewSet(viewsets.ModelViewSet):
    queryset = JobPartUsage.objects.all()
    serializer_class = JobPartUsageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return JobPartUsage.objects.none()
        if user.is_superuser:
            return JobPartUsage.objects.all()
        return JobPartUsage.objects.filter(job__owner=user)

    def perform_create(self, serializer):
        # deduct quantity from inventory
        usage = serializer.save()
        item = usage.item
        item.quantity -= usage.quantity_used
        item.save()
