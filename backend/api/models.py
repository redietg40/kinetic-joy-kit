from django.db import models

class Customer(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=50)
    email = models.EmailField()
    address = models.TextField()
    telegram_username = models.CharField(max_length=100, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Technician(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=50)
    email = models.EmailField()
    specialty = models.CharField(max_length=100)
    status = models.CharField(max_length=50)

    def __str__(self):
        return self.name

class Job(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    title = models.CharField(max_length=255)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name="jobs")
    technician = models.ForeignKey(Technician, on_delete=models.SET_NULL, null=True, blank=True, related_name="jobs")
    service_type = models.CharField(max_length=100)
    status = models.CharField(max_length=50)
    scheduled_at = models.DateTimeField(null=True, blank=True)
    priority = models.CharField(max_length=50)
    technician_notes = models.TextField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Booking Deposit Fields (Chapa Escrow)
    booking_fee_paid = models.BooleanField(default=False)
    booking_fee_amount = models.DecimalField(max_digits=10, decimal_places=2, default=150.00)
    booking_chapa_tx_ref = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return self.title

class Invoice(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name="invoices")
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name="invoices")
    line_items = models.JSONField(default=list)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    tax = models.DecimalField(max_digits=12, decimal_places=2)
    total = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=10, default="ETB")
    status = models.CharField(max_length=50)
    payment_method = models.CharField(max_length=50, blank=True, null=True)
    chapa_tx_ref = models.CharField(max_length=255, blank=True, null=True)
    issued_at = models.DateTimeField(auto_now_add=True)
    paid_at = models.DateTimeField(null=True, blank=True)

    # Payout Tracking
    commission_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    technician_payout_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    payout_status = models.CharField(max_length=50, default='pending') # 'pending', 'paid_to_tech'

    def __str__(self):
        return self.id

class TechnicianLedger(models.Model):
    technician = models.OneToOneField(Technician, on_delete=models.CASCADE, related_name="ledger")
    total_earned = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    total_paid_out = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    current_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)

    def __str__(self):
        return f"{self.technician.name} Ledger - {self.current_balance} ETB"

class ChatMessage(models.Model):
    sender = models.CharField(max_length=50) # 'owner', or technician ID
    receiver = models.CharField(max_length=50) # 'owner', or technician ID
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"From {self.sender} to {self.receiver} at {self.timestamp}"
