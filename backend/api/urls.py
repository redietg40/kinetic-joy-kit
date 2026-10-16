from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    CustomerViewSet, TechnicianViewSet, JobViewSet, InvoiceViewSet,
    RegisterView, MeView, BookServiceView, ChapaWebhookView, TelegramWebhookView,
    ChatMessageViewSet, InventoryItemViewSet, JobPartUsageViewSet,
    CustomerPortalLookupView, CustomerVerifyNationalIdView
)

router = DefaultRouter()
router.register(r'customers', CustomerViewSet)
router.register(r'technicians', TechnicianViewSet)
router.register(r'jobs', JobViewSet)
router.register(r'invoices', InvoiceViewSet)
router.register(r'messages', ChatMessageViewSet)
router.register(r'inventory', InventoryItemViewSet)
router.register(r'job-parts', JobPartUsageViewSet)

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='auth_register'),
    path('auth/login/', TokenObtainPairView.as_view(), name='auth_login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='auth_refresh'),
    path('auth/me/', MeView.as_view(), name='auth_me'),
    path('book/', BookServiceView.as_view(), name='public_book'),
    path('customer-portal/lookup/', CustomerPortalLookupView.as_view(), name='customer_portal_lookup'),
    path('customer-portal/verify-id/', CustomerVerifyNationalIdView.as_view(), name='customer_verify_id'),
    path('webhooks/chapa/', ChapaWebhookView.as_view(), name='chapa_webhook'),
    path('webhooks/telegram/', TelegramWebhookView.as_view(), name='telegram_webhook'),
    path('', include(router.urls)),
]
