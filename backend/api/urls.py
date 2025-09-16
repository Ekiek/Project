from rest_framework.routers import DefaultRouter
from .views import HotelViewSet, RoomViewSet, BookingViewSet

router = DefaultRouter()
router.register('hotels', HotelViewSet, basename='hotel')
router.register('rooms', RoomViewSet, basename='room')
router.register('bookings', BookingViewSet, basename='booking')

urlpatterns = router.urls
