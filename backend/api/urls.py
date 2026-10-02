from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import CustomerViewSet, TechnicianViewSet, JobViewSet, InvoiceViewSet, RegisterView, MeView

router = DefaultRouter()
router.register(r'customers', CustomerViewSet)
router.register(r'technicians', TechnicianViewSet)
router.register(r'jobs', JobViewSet)
router.register(r'invoices', InvoiceViewSet)

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='auth_register'),
    path('auth/login/', TokenObtainPairView.as_view(), name='auth_login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='auth_refresh'),
    path('auth/me/', MeView.as_view(), name='auth_me'),
    path('', include(router.urls)),
]
