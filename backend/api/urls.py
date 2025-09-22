
from django.urls import path, include
from rest_framework.authtoken import views
from rest_framework.routers import DefaultRouter
from .views import HotelViewSet, RoomViewSet, BookingViewSet, RegisterView, CustomAuthToken, CurrentUserView

router = DefaultRouter()
router.register(r'hotels', HotelViewSet)
router.register(r'rooms', RoomViewSet) 
router.register(r'bookings', BookingViewSet)

app_name = "api"
urlpatterns = [
    path('', include(router.urls)),
    path('register/', RegisterView.as_view(), name='register'),
    path('api-token-auth/', CustomAuthToken.as_view(), name='api_token_auth'),
    path('users/me/', CurrentUserView.as_view(), name='current_user'),
]