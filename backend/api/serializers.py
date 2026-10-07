from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Customer, Technician, Job, Invoice

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    role = serializers.CharField(write_only=True, required=False) # 'technician' or 'customer'
    name = serializers.CharField(write_only=True, required=False) # Full name

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'role', 'name')
        extra_kwargs = {'username': {'required': False}}

    def create(self, validated_data):
        role = validated_data.pop('role', None)
        name = validated_data.pop('name', '')
        # email is used as username
        user = User.objects.create_user(
            username=validated_data['email'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        
        # Create corresponding profile
        if role == 'technician':
            Technician.objects.create(
                id=f"t{user.id}",
                name=name,
                email=user.email,
                phone="",
                status="offline",
                specialty="General"
            )
        elif role == 'customer':
            Customer.objects.create(
                id=f"c{user.id}",
                name=name,
                email=user.email,
                phone="",
                address=""
            )
            
        return user

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = '__all__'

class TechnicianSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = Technician
        fields = '__all__'
        
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
        fields = ('id', 'title', 'service_type', 'status', 'scheduled_at', 'priority', 'technician_notes', 'description', 'address', 'completed_at', 'customer_id', 'technician_id', 'booking_fee_paid', 'booking_fee_amount', 'booking_chapa_tx_ref')

class InvoiceSerializer(serializers.ModelSerializer):
    job_id = serializers.PrimaryKeyRelatedField(source='job', queryset=Job.objects.all())
    customer_id = serializers.PrimaryKeyRelatedField(source='customer', queryset=Customer.objects.all())

    class Meta:
        model = Invoice
        fields = ('id', 'subtotal', 'tax', 'total', 'currency', 'status', 'payment_method', 'chapa_tx_ref', 'issued_at', 'paid_at', 'job_id', 'customer_id', 'line_items')

from .models import ChatMessage
class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = '__all__'
