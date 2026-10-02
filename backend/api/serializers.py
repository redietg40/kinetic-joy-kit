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
    class Meta:
        model = Technician
        fields = '__all__'

class JobSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = '__all__'

class InvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = '__all__'
