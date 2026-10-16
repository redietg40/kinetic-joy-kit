from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Customer, Technician, Job, Invoice

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    role = serializers.CharField(write_only=True, required=False) # 'technician' or 'customer'
    name = serializers.CharField(write_only=True, required=False) # Full name
    email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'role', 'name')
        extra_kwargs = {'username': {'required': False}}

    def validate_email(self, value):
        if value and (User.objects.filter(username__iexact=value).exists() or User.objects.filter(email__iexact=value).exists()):
            raise serializers.ValidationError("An account with this email already exists. Please log in.")
        return value

    def create(self, validated_data):
        import uuid
        role = validated_data.pop('role', None)
        name = validated_data.pop('name', '')
        email = validated_data.get('email') or ''
        username = validated_data.get('username') or email or f"user_{uuid.uuid4().hex[:8]}"
        
        user = User.objects.create_user(
            username=username,
            email=email,
            password=validated_data['password'],
            first_name=name
        )
        
        # Create corresponding profile
        if role == 'owner':
            user.is_staff = True
            user.is_superuser = True
            user.save()
        elif role == 'technician':
            Technician.objects.create(
                id=f"t{user.id}",
                name=name,
                email=user.email or None,
                phone="",
                status="offline",
                specialty="General"
            )
        elif role == 'customer':
            Customer.objects.create(
                id=f"c{user.id}",
                name=name,
                email=user.email or None,
                phone="",
                address=""
            )
            
        return user

class CustomerSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=False, allow_null=True, allow_blank=True)
    phone = serializers.CharField(required=False, allow_null=True, allow_blank=True)

    class Meta:
        model = Customer
        fields = '__all__'
        read_only_fields = ['owner']

class TechnicianSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = Technician
        fields = '__all__'
        read_only_fields = ['owner']
        
    def create(self, validated_data):
        from django.contrib.auth.models import User
        email = validated_data.get('email')
        password = validated_data.pop('password', 'password123')
        if email and not User.objects.filter(username=email).exists():
            User.objects.create_user(
                username=email,
                email=email,
                password=password
            )
        return super().create(validated_data)

class JobSerializer(serializers.ModelSerializer):
    customer_id = serializers.PrimaryKeyRelatedField(source='customer', queryset=Customer.objects.all())
    technician_id = serializers.PrimaryKeyRelatedField(source='technician', queryset=Technician.objects.all(), required=False, allow_null=True)

    class Meta:
        model = Job
        fields = ('id', 'title', 'service_type', 'status', 'scheduled_at', 'priority', 'technician_notes', 'description', 'address', 'completed_at', 'customer_id', 'technician_id', 'booking_fee_paid', 'booking_fee_amount', 'booking_chapa_tx_ref', 'owner')
        read_only_fields = ['owner']

class InvoiceSerializer(serializers.ModelSerializer):
    job_id = serializers.PrimaryKeyRelatedField(source='job', queryset=Job.objects.all())
    customer_id = serializers.PrimaryKeyRelatedField(source='customer', queryset=Customer.objects.all())

    class Meta:
        model = Invoice
        fields = ('id', 'subtotal', 'tax', 'total', 'currency', 'status', 'payment_method', 'chapa_tx_ref', 'issued_at', 'paid_at', 'job_id', 'customer_id', 'line_items', 'owner')
        read_only_fields = ['owner']

from .models import ChatMessage, InventoryItem, JobPartUsage
class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = '__all__'
        read_only_fields = ['owner']

class InventoryItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryItem
        fields = '__all__'
        read_only_fields = ['owner']

class JobPartUsageSerializer(serializers.ModelSerializer):
    item_details = InventoryItemSerializer(source='item', read_only=True)
    class Meta:
        model = JobPartUsage
        fields = '__all__'
