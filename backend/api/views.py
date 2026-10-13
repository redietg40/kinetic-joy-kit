from rest_framework import viewsets, generics, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth.models import User
from .models import Customer, Technician, Job, Invoice
from django.conf import settings
from .serializers import CustomerSerializer, TechnicianSerializer, JobSerializer, InvoiceSerializer, UserSerializer
from .telegram_utils import send_telegram_message, send_telegram_photo, resolve_chat_id

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
        try:
            data = request.data
            email = (data.get('email') or '').strip().lower()
            if not email:
                return Response({"error": "Email is required."}, status=400)

            # Assign to business owner
            owner = User.objects.filter(is_superuser=True).first() or User.objects.first()

            # Find existing customer or create new
            import uuid
            customer = Customer.objects.filter(email__iexact=email).first()
            if not customer:
                customer = Customer.objects.create(
                    id=f"c_{uuid.uuid4().hex[:8]}",
                    name=data.get('name', 'Client'),
                    phone=data.get('phone', ''),
                    email=email,
                    address=data.get('address', 'Addis Ababa'),
                    telegram_username=data.get('telegram_username', ''),
                    owner=owner
                )
            else:
                if data.get('telegram_username'):
                    customer.telegram_username = data.get('telegram_username')
                if not customer.owner and owner:
                    customer.owner = owner
                customer.save()

            # Create unassigned pending job
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
                address=data.get('address', customer.address),
                owner=owner
            )

            # Send confirmation email
            from django.core.mail import send_mail
            from django.conf import settings

            try:
                send_mail(
                    "Service Request Received - FieldFlow",
                    f"Hi {customer.name},\n\nWe have received your service request for '{job.title}'.\nWe are reviewing it and a technician will schedule your repair shortly!\n\nThanks,\nFieldFlow Team",
                    settings.DEFAULT_FROM_EMAIL,
                    [customer.email],
                    fail_silently=True,
                )
            except Exception as mail_err:
                print(f"Mail send error: {mail_err}")

            # Send Telegram notification if telegram_username is provided
            if customer.telegram_username:
                try:
                    live_url = "https://kinetic-joy-kit-iota.vercel.app"
                    pay_btn_url = f"{live_url}/chapa-checkout?job_id={job.id}&amount=150"
                    tg_msg = (
                        f"🛠️ *FieldFlow Service Request Received*\n\n"
                        f"Hi {customer.name}, we received your service request for:\n"
                        f"*{job.title}* ({job.service_type})\n\n"
                        f"📍 *Service Location:* {job.address}\n"
                        f"💳 *Booking Deposit:* 150 ETB\n\n"
                        f"Please tap below to pay the deposit via Chapa and confirm your booking!"
                    )
                    send_telegram_message(
                        customer.telegram_username,
                        tg_msg,
                        button_text="💳 Pay Deposit (150 ETB)",
                        button_url=pay_btn_url
                    )
                except Exception as tg_err:
                    print(f"[Telegram Booking Notification Error]: {tg_err}")

            # Return relative checkout URL
            checkout_url = f"/chapa-checkout?job_id={job.id}&amount=150"

            return Response({
                "status": "success",
                "job_id": job.id,
                "checkout_url": checkout_url,
                "message": "Please complete the booking deposit to confirm your request."
            })
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"error": f"Booking failed: {str(e)}"}, status=400)

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

                    # Notify customer via Telegram if username is available
                    if invoice.customer and invoice.customer.telegram_username:
                        try:
                            tg_msg = (
                                f"🎉 *FieldFlow Payment Received!*\n\n"
                                f"Hi {invoice.customer.name}, we have received your payment of {invoice.total} {invoice.currency} for Invoice #{invoice.id}.\n\n"
                                f"Thank you for choosing FieldFlow Services!"
                            )
                            send_telegram_message(invoice.customer.telegram_username, tg_msg)
                        except Exception as tg_err:
                            print(f"[Telegram Invoice Paid Error]: {tg_err}")

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

                # Notify customer via Telegram that booking fee was received
                if job.customer and job.customer.telegram_username:
                    try:
                        tg_msg = (
                            f"✅ *FieldFlow Booking Deposit Confirmed!*\n\n"
                            f"Hi {job.customer.name}, your booking deposit of 150 ETB for *'{job.title}'* has been verified!\n\n"
                            f"Your service request is confirmed and our team will assign a technician shortly."
                        )
                        send_telegram_message(job.customer.telegram_username, tg_msg)
                    except Exception as tg_err:
                        print(f"[Telegram Booking Fee Paid Error]: {tg_err}")

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
            
            # Telegram Integration
            if job.customer and job.customer.telegram_username:
                try:
                    bot_msg = (
                        f"🔧 *FieldFlow Repair Scheduled*\n\n"
                        f"Hi {job.customer.name}, your service request *'{job.title}'* has been officially scheduled!\n\n"
                        f"📅 *Date & Time:* {date_str}\n"
                        f"👷 *Technician:* {tech_name}\n"
                        f"📍 *Location:* {job.address}\n\n"
                        f"Thank you for choosing FieldFlow!"
                    )
                    send_telegram_message(job.customer.telegram_username, bot_msg)
                except Exception as tg_err:
                    print(f"[Telegram Job Scheduled Error]: {tg_err}")
        elif old_status != job.status and job.customer and job.customer.telegram_username:
            try:
                status_label = {
                    'in_progress': 'In Progress ⏳ (Technician is actively working on your repair)',
                    'completed': 'Completed ✨ (Repair finished successfully!)',
                    'cancelled': 'Cancelled ❌',
                }.get(job.status, job.status.replace('_', ' ').capitalize())
                
                status_msg = (
                    f"📋 *FieldFlow Status Update*\n\n"
                    f"Hi {job.customer.name}, the status of your repair *'{job.title}'* is now:\n"
                    f"*{status_label}*\n\n"
                    f"Thank you for choosing FieldFlow!"
                )
                send_telegram_message(job.customer.telegram_username, status_msg)
            except Exception as tg_err:
                print(f"[Telegram Job Status Error]: {tg_err}")

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
        
        if not customer or not customer.telegram_username:
            return Response({"error": "Customer has no Telegram username specified"}, status=status.HTTP_400_BAD_REQUEST)
            
        app_url = "https://kinetic-joy-kit-iota.vercel.app"
        checkout_url = f"{app_url}/chapa-checkout?invoice_id={invoice.id}&amount={invoice.total}"
        
        bot_msg = (
            f"🧾 *FieldFlow Invoice #{invoice.id}*\n\n"
            f"Hi {customer.name}, here is your receipt/invoice for your repair:\n"
            f"• *Subtotal:* {invoice.subtotal} {invoice.currency}\n"
            f"• *Tax:* {invoice.tax} {invoice.currency}\n"
            f"• *Total Due:* {invoice.total} {invoice.currency}\n\n"
            f"Status: *{invoice.status.upper()}*\n\n"
            f"Thank you for choosing FieldFlow Services!"
        )
        
        try:
            image_data_b64 = request.data.get('image_data')
            
            if image_data_b64 and image_data_b64.startswith('data:image'):
                header, b64_str = image_data_b64.split(',', 1)
                import base64
                image_bytes = base64.b64decode(b64_str)
                
                result = send_telegram_photo(
                    customer.telegram_username,
                    image_bytes,
                    caption=bot_msg,
                    button_text="💳 Pay via Chapa",
                    button_url=checkout_url
                )
            else:
                result = send_telegram_message(
                    customer.telegram_username,
                    bot_msg,
                    button_text="💳 Pay via Chapa",
                    button_url=checkout_url
                )
            
            if result.get("success"):
                return Response({"status": "Sent successfully via Telegram!"})
            else:
                return Response({"error": result.get("error", "Failed to send Telegram message")}, status=status.HTTP_400_BAD_REQUEST)
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
