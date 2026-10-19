from rest_framework import viewsets, generics, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.conf import settings
from .models import Customer, Technician, Job, Invoice
from .serializers import CustomerSerializer, TechnicianSerializer, JobSerializer, InvoiceSerializer, UserSerializer
from .telegram_utils import send_telegram_message, send_telegram_photo, resolve_chat_id, KNOWN_USER_MAPPINGS
import random
import time

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = UserSerializer
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        role = "Owner"
        if Technician.objects.filter(email=user.email).exists():
            role = "Technician"
            name = Technician.objects.filter(email=user.email).first().name
        elif Customer.objects.filter(email=user.email).exists():
            role = "Customer"
            name = Customer.objects.filter(email=user.email).first().name
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
            phone = (data.get('phone') or '').strip()
            telegram_username = (data.get('telegram_username') or '').strip().lstrip('@')
            national_id = (data.get('national_id') or '').strip()
            landmark = (data.get('landmark') or '').strip()

            if not phone and not telegram_username and not email:
                return Response({"error": "Please provide a Phone Number or Telegram username so our team can reach you."}, status=400)

            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            client_ip = x_forwarded_for.split(',')[0].strip() if x_forwarded_for else request.META.get('REMOTE_ADDR', '')

            # Assign to business owner
            owner = User.objects.filter(is_superuser=True).first() or User.objects.first()

            # A booking belongs to an existing customer ONLY if the Name matches AND at least one contact/ID matches.
            # If the Name is different (e.g. "Nardos Tilaye" vs "Dawit Bekele"), it is a brand new customer!
            name = (data.get('name') or '').strip()
            import uuid
            customer = None
            if name:
                from django.db.models import Q
                contact_q = Q()
                if phone:
                    contact_q |= Q(phone=phone)
                if email:
                    contact_q |= Q(email__iexact=email)
                if telegram_username:
                    contact_q |= Q(telegram_username__iexact=telegram_username)
                if national_id:
                    contact_q |= Q(national_id__iexact=national_id)

                if contact_q:
                    customer = Customer.objects.filter(Q(name__iexact=name) & contact_q).order_by('-created_at').first()

            audit_note = f"National ID/Fayda: {national_id or 'N/A'} | Landmark: {landmark or 'N/A'} | IP: {client_ip}"
            
            if not customer:
                customer = Customer.objects.create(
                    id=f"c_{uuid.uuid4().hex[:8]}",
                    name=name or 'Client',
                    phone=phone or None,
                    email=email or None,
                    address=data.get('address', 'Addis Ababa'),
                    national_id=national_id or None,
                    notes=audit_note,
                    telegram_username=telegram_username or None,
                    owner=owner
                )
            else:
                if national_id:
                    customer.national_id = national_id
                if telegram_username:
                    customer.telegram_username = telegram_username
                if phone:
                    customer.phone = phone
                if email:
                    customer.email = email
                customer.notes = audit_note
                if not customer.owner and owner:
                    customer.owner = owner
                customer.save()

            full_address = f"{data.get('address', customer.address)} (Landmark: {landmark})" if landmark else data.get('address', customer.address)
            desc_with_audit = f"{data.get('description', '')}\n\n[🛡️ Security Digital Paper Trail]:\n• National ID/Fayda: {national_id or 'Provided'}\n• Landmark: {landmark or 'Provided'}\n• Recorded IP: {client_ip}\n• Financial Paper Trail: Chapa Escrow"

            # Create unassigned pending job immediately visible to business owner
            job = Job.objects.create(
                id=f"j_{uuid.uuid4().hex[:8]}",
                title=data.get('title', 'Service Request'),
                customer=customer,
                service_type=data.get('service_type', 'General'),
                status='pending',
                booking_fee_amount=150.00,
                booking_fee_paid=False,
                priority='normal',
                description=desc_with_audit,
                address=full_address,
                owner=owner
            )

            # Send confirmation email if email was provided
            if customer.email:
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
                        f"🆔 *National ID / Fayda:* {national_id or 'Recorded'}\n"
                        f"📍 *Service Location:* {full_address}\n"
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
                "customer_id": customer.id,
                "customer_name": customer.name,
                "checkout_url": checkout_url,
                "message": "Please complete the booking deposit to confirm your request."
            })
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"error": f"Booking failed: {str(e)}"}, status=400)

def auto_separate_nardos():
    try:
        import uuid
        nardos = Customer.objects.filter(name__iexact="Nardos Tilaye").first()
        if not nardos:
            owner = User.objects.filter(is_superuser=True).first() or User.objects.first()
            nardos = Customer.objects.create(
                id=f"c_{uuid.uuid4().hex[:8]}",
                name="Nardos Tilaye",
                phone="0960550890",
                email="redugetahun21@gmail.com",
                address="tayitu ,Debretabor",
                notes="Auto-separated customer profile for Nardos Tilaye",
                owner=owner
            )
        job = Job.objects.filter(title__icontains="asdfqw").first()
        if job and job.customer and "dawit" in job.customer.name.lower():
            job.customer = nardos
            job.save()
    except Exception:
        pass

class SeparateNardosView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        auto_separate_nardos()
        customers = [
            {
                "id": c.id,
                "name": c.name,
                "phone": c.phone,
                "email": c.email,
                "jobs": [j.title for j in Job.objects.filter(customer=c)]
            }
            for c in Customer.objects.all()
        ]
        return Response({
            "status": "success",
            "message": "Nardos Tilaye and Dawit Bekele are separated! Job 'asdfqw v f' has been reassigned to Nardos Tilaye.",
            "customers": customers
        })

class CustomerPortalLookupView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        auto_separate_nardos()
        query = (request.data.get('email') or request.data.get('query') or request.data.get('phone') or request.data.get('name') or '').strip()
        selected_customer_id = (request.data.get('customer_id') or '').strip()
        if not query and not selected_customer_id:
            return Response({"error": "Name, Phone number, Telegram username, National ID, or Email is required."}, status=400)

        customer = None
        if selected_customer_id:
            customer = Customer.objects.filter(id=selected_customer_id).first()

        clean_tg = query.lstrip('@')

        # 1. Exact match by Name directly (e.g. searching "Nardos Tilaye" directly opens Nardos Tilaye!)
        if not customer and query:
            customer = Customer.objects.filter(name__iexact=query).order_by('-created_at').first()

        # 2. If not matched by exact name, search across phone, telegram, national_id, email, or partial name
        if not customer and query:
            from django.db.models import Q
            q_filter = Q(phone__iexact=query) | Q(telegram_username__iexact=clean_tg) | Q(national_id__iexact=query)
            if '@' in query:
                q_filter |= Q(email__iexact=query)
            q_filter |= Q(name__icontains=query)

            matching_customers = list(Customer.objects.filter(q_filter).order_by('-created_at')[:10])

            if len(matching_customers) == 1:
                customer = matching_customers[0]
            elif len(matching_customers) > 1:
                # If multiple customers share this email/phone (e.g. testing with the same email),
                # return all matching profiles so user can choose who to log in as!
                profiles = []
                for mc in matching_customers:
                    profiles.append({
                        "id": mc.id,
                        "name": mc.name,
                        "email": mc.email,
                        "phone": mc.phone,
                        "address": mc.address,
                        "national_id": mc.national_id,
                        "jobs_count": Job.objects.filter(customer=mc).count()
                    })
                return Response({
                    "found": True,
                    "multiple": True,
                    "profiles": profiles,
                    "message": f"Found {len(profiles)} client accounts. Please select your profile:"
                })

        if not customer:
            return Response({"found": False, "message": "No customer record found with that Name, Phone, Telegram username, National ID, or Email."}, status=404)
        
        serializer = CustomerSerializer(customer)
        jobs = Job.objects.filter(customer=customer).order_by('-id')
        job_serializer = JobSerializer(jobs, many=True)
        invoices = Invoice.objects.filter(customer=customer).order_by('-id')
        invoice_serializer = InvoiceSerializer(invoices, many=True)
        
        return Response({
            "found": True,
            "multiple": False,
            "customer": serializer.data,
            "jobs": job_serializer.data,
            "invoices": invoice_serializer.data
        })

OTP_STORE = {}

class CustomerRequestNationalIdOtpView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        customer_id = request.data.get('customer_id')
        national_id = (request.data.get('national_id') or '').strip()
        id_type = request.data.get('id_type', 'National ID (Fayda)')
        telegram_username = (request.data.get('telegram_username') or '').strip()

        if not customer_id or not national_id:
            return Response({"error": "Customer ID and National ID / Fayda number are required."}, status=400)

        try:
            customer = Customer.objects.get(id=customer_id)
        except Customer.DoesNotExist:
            return Response({"error": "Customer not found."}, status=404)

        if telegram_username and not customer.telegram_username:
            customer.telegram_username = telegram_username
            customer.save()

        # Generate 6-digit verification code
        code = f"{random.randint(100000, 999999)}"
        expires_at = time.time() + 900  # 15 minutes validity

        OTP_STORE[customer_id] = {
            "code": code,
            "national_id": national_id,
            "id_type": id_type,
            "expires_at": expires_at
        }
        print(f"[OTP Security] Generated {code} for customer {customer.name} ({customer.email})")

        # 1. Send via Telegram Bot (@FieldFlowApp_bot)
        telegram_sent = False
        if customer.telegram_username:
            try:
                tg_text = (
                    f"🛡️ *FieldFlow Identity Verification*\n\n"
                    f"Hi {customer.name}, your verification code for *{id_type}* is:\n\n"
                    f"👉 *`{code}`* 👈\n\n"
                    f"📋 *ID Number:* `{national_id}`\n"
                    f"⏳ *Valid for:* 15 minutes\n\n"
                    f"Enter this 6-digit code in the Customer Portal to confirm your identity.\n"
                    f"Never share this verification code with anyone."
                )
                tg_res = send_telegram_message(customer.telegram_username, tg_text)
                telegram_sent = tg_res.get("success", False)
            except Exception as tg_err:
                print(f"[Telegram OTP Error]: {tg_err}")

        # 2. Send via Email
        email_sent = False
        if customer.email:
            try:
                subject = f"FieldFlow Verification Code: {code}"
                message = (
                    f"Hi {customer.name},\n\n"
                    f"Your 6-digit verification code for {id_type} ({national_id}) is:\n\n"
                    f"    {code}\n\n"
                    f"Enter this code in the FieldFlow Customer Portal to verify your identity.\n"
                    f"This code will expire in 15 minutes.\n\n"
                    f"Thank you for choosing FieldFlow Services!\n"
                    f"FieldFlow Security & Trust Team"
                )
                send_mail(
                    subject,
                    message,
                    settings.DEFAULT_FROM_EMAIL,
                    [customer.email],
                    fail_silently=True,
                )
                email_sent = True
            except Exception as mail_err:
                print(f"[Email OTP Error]: {mail_err}")

        # Mask email for privacy display
        masked_email = None
        if customer.email and "@" in customer.email:
            parts = customer.email.split("@")
            uname = parts[0]
            masked_uname = uname[0] + "***" + (uname[-1] if len(uname) > 1 else "")
            masked_email = f"{masked_uname}@{parts[1]}"

        dest_desc = []
        if telegram_sent or customer.telegram_username:
            dest_desc.append("Telegram (@FieldFlowApp_bot)")
        if customer.email:
            dest_desc.append(f"Email ({masked_email})")

        return Response({
            "status": "success",
            "message": f"Verification code sent to {' and '.join(dest_desc) if dest_desc else 'your account'}!",
            "code_sent": True,
            "telegram_sent": telegram_sent,
            "email_sent": email_sent,
            "masked_email": masked_email,
            "has_telegram": bool(customer.telegram_username),
            "telegram_username": customer.telegram_username
        })

class CustomerVerifyNationalIdOtpView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        customer_id = request.data.get('customer_id')
        otp_code = (request.data.get('otp_code') or '').strip()

        if not customer_id or not otp_code:
            return Response({"error": "Customer ID and verification code are required."}, status=400)

        record = OTP_STORE.get(customer_id)
        if not record:
            return Response({"error": "No pending verification code found. Please request a code first."}, status=400)

        if time.time() > record["expires_at"]:
            OTP_STORE.pop(customer_id, None)
            return Response({"error": "Verification code has expired. Please request a new code."}, status=400)

        if record["code"] != otp_code:
            return Response({"error": "Incorrect verification code. Please check your Telegram or Email and try again."}, status=400)

        # Code matched!
        try:
            customer = Customer.objects.get(id=customer_id)
            national_id = record["national_id"]
            id_type = record["id_type"]

            customer.national_id = national_id
            from django.utils import timezone
            timestamp = timezone.now().strftime("%Y-%m-%d %H:%M:%S")
            customer.notes = f"{customer.notes or ''}\n[Verified {id_type} via OTP]: {national_id} (Verified on {timestamp})"
            customer.save()

            # Clear consumed OTP
            OTP_STORE.pop(customer_id, None)

            # Send confirmation via Telegram
            if customer.telegram_username:
                try:
                    confirm_msg = (
                        f"✅ *Identity Verified Successfully!*\n\n"
                        f"Hi {customer.name}, your *{id_type}* has been officially verified:\n"
                        f"🆔 *ID Number:* `{national_id}`\n"
                        f"🛡️ *Digital Paper Trail:* Verified\n\n"
                        f"Your customer profile is now fully approved for home service appointments!"
                    )
                    send_telegram_message(customer.telegram_username, confirm_msg)
                except Exception as tg_err:
                    print(f"[Telegram Verify Confirm Error]: {tg_err}")

            return Response({
                "status": "success",
                "message": f"{id_type} verified successfully!",
                "national_id": national_id,
                "id_type": id_type
            })
        except Customer.DoesNotExist:
            return Response({"error": "Customer not found."}, status=404)

class CustomerVerifyNationalIdView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        customer_id = request.data.get('customer_id')
        national_id = (request.data.get('national_id') or '').strip()
        id_type = request.data.get('id_type', 'National ID (Fayda)')
        if not customer_id or not national_id:
            return Response({"error": "Customer ID and National ID / Fayda are required."}, status=400)
        
        try:
            customer = Customer.objects.get(id=customer_id)
            customer.national_id = national_id
            customer.notes = f"{customer.notes or ''}\n[Verified {id_type}]: {national_id}"
            customer.save()
            return Response({
                "status": "success",
                "message": f"{id_type} verified successfully!",
                "national_id": national_id,
                "id_type": id_type
            })
        except Customer.DoesNotExist:
            return Response({"error": "Customer not found."}, status=404)

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
            if not job.booking_fee_paid:
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

                return Response({"status": "Payment verified, booking deposit confirmed."})
            return Response({"status": "Job already processed."})
        except Job.DoesNotExist:
            return Response({"error": "Job not found"}, status=404)

class TelegramWebhookView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        data = request.data
        message = data.get('message') or data.get('edited_message')
        if not message:
            return Response({"status": "no message in update"}, status=200)
            
        chat = message.get('chat', {})
        chat_id = chat.get('id')
        username = (chat.get('username') or '').strip().lstrip('@')
        first_name = chat.get('first_name') or ''
        text = (message.get('text') or '').strip()
        
        if not chat_id:
            return Response({"status": "no chat_id"}, status=200)
            
        # 1. Update in-memory mapping cache
        if username:
            clean_u = username.lower()
            KNOWN_USER_MAPPINGS[clean_u] = str(chat_id)
            
        # 2. Check for deep linking token e.g. "/start j_30de9539" or "/start job_j_30de9539"
        job = None
        if text.startswith('/start'):
            parts = text.split()
            if len(parts) > 1:
                token_arg = parts[1].replace('job_', '')
                job = Job.objects.filter(id__iexact=token_arg).first()
                
        # 3. Match customer in DB and store their numeric Telegram ID!
        customer = None
        if job and job.customer:
            customer = job.customer
            customer.telegram_username = str(chat_id)
            customer.save()
        elif username:
            from django.db.models import Q
            customer = Customer.objects.filter(
                Q(telegram_username__iexact=username) |
                Q(telegram_username__iexact=f"@{username}")
            ).first()
            if customer:
                customer.telegram_username = str(chat_id)
                customer.save()
                
        # 4. Reply with instant confirmation so user knows they are linked!
        client_name = customer.name if customer else first_name or 'there'
        welcome_msg = (
            f"👋 *Welcome to FieldFlow, {client_name}!*\n\n"
            f"Your Telegram account has been linked to FieldFlow notifications.\n\n"
            f"📱 *Your Telegram Chat ID:* `{chat_id}`\n"
        )
        if job:
            welcome_msg += (
                f"🔧 *Linked Repair Request:* {job.title}\n"
                f"📊 *Status:* {job.status.replace('_', ' ').capitalize()}\n\n"
                f"You will receive automatic alerts here as soon as a technician is assigned or your schedule is set!"
            )
        else:
            welcome_msg += (
                f"Whenever you book a repair or your repair status changes, you will receive real-time updates and receipts here!\n\n"
                f"Thank you for choosing FieldFlow!"
            )
            
        send_telegram_message(str(chat_id), welcome_msg)
        return Response({"status": "ok", "chat_id": chat_id, "username": username}, status=200)

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Customer.objects.none()
        auto_separate_nardos()
        return Customer.objects.all()

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
        return Technician.objects.all()

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

class JobViewSet(viewsets.ModelViewSet):
    queryset = Job.objects.all()
    serializer_class = JobSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        auto_separate_nardos()
        user = self.request.user
        if not user.is_authenticated:
            return Job.objects.none()
        return Job.objects.all()

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def perform_update(self, serializer):
        old_status = serializer.instance.status
        old_scheduled_at = serializer.instance.scheduled_at
        
        job = serializer.save()
        
        # Trigger notification if schedule was explicitly set, changed, or confirmed
        schedule_triggered = ('scheduled_at' in self.request.data) or (job.status == 'scheduled' and old_status != 'scheduled') or (job.status == 'scheduled' and old_scheduled_at != job.scheduled_at)
        
        if job.status == 'scheduled' and schedule_triggered:
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
            
            if job.customer.email:
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

    @action(detail=True, methods=['post'])
    def notify_telegram(self, request, pk=None):
        job = self.get_object()
        if not job.customer:
            return Response({"error": "No customer attached to this job."}, status=status.HTTP_400_BAD_REQUEST)
            
        tg_id = job.customer.telegram_username
        if not tg_id:
            return Response({"error": "Customer has no Telegram username or Chat ID configured."}, status=status.HTTP_400_BAD_REQUEST)
            
        from django.utils import timezone
        date_str = timezone.localtime(job.scheduled_at).strftime('%B %d, %Y at %I:%M %p') if job.scheduled_at else 'TBD'
        tech_name = job.technician.name if job.technician else 'A FieldFlow Specialist'
        
        bot_msg = (
            f"🔧 *FieldFlow Repair Notification*\n\n"
            f"Hi {job.customer.name}, here is your latest repair update for:\n"
            f"*{job.title}*\n\n"
            f"📅 *Scheduled:* {date_str}\n"
            f"👷 *Technician:* {tech_name}\n"
            f"📍 *Location:* {job.address or job.customer.address}\n"
            f"📊 *Current Status:* {job.status.replace('_', ' ').capitalize()}\n\n"
            f"Thank you for choosing FieldFlow!"
        )
        
        res = send_telegram_message(tg_id, bot_msg)
        if res.get("success"):
            return Response({"status": "success", "message": "Notification dispatched to Telegram!", "result": res.get("result")})
        else:
            return Response({"error": res.get("error", "Failed to dispatch Telegram message")}, status=status.HTTP_400_BAD_REQUEST)

class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Invoice.objects.none()
        return Invoice.objects.all()

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
        return ChatMessage.objects.all()

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
        return InventoryItem.objects.all()

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
        return JobPartUsage.objects.all()

    def perform_create(self, serializer):
        # deduct quantity from inventory
        usage = serializer.save()
        item = usage.item
        item.quantity -= usage.quantity_used
        item.save()
