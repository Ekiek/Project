from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import HotelViewSet, RoomViewSet, BookingViewSet, RegisterView

router = DefaultRouter()
router.register(r"hotels", HotelViewSet, basename="hotel")
router.register(r"rooms", RoomViewSet, basename="room")
router.register(r"bookings", BookingViewSet, basename="booking")

urlpatterns = [
    path("", include(router.urls)),
    path("register/", RegisterView.as_view(), name="register"), 
]

