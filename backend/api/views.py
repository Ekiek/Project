from rest_framework import viewsets, generics, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny  
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.models import User
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from django.db import transaction
from .models import Hotel, Room, Booking
from rest_framework.authtoken.models import Token
from rest_framework.views import APIView
from rest_framework.authtoken.views import ObtainAuthToken
from django.contrib.auth import authenticate
from .serializers import HotelSerializer, RoomSerializer, BookingSerializer, UserSerializer


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

class CurrentUserView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
class HotelViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Hotel.objects.all()
    serializer_class = HotelSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        qs = super().get_queryset()
        city = self.request.query_params.get("city")
        if city:
            qs = qs.filter(city__iexact=city) 
        return qs

class RoomViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Room.objects.select_related('hotel').all()
    serializer_class = RoomSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        qs = super().get_queryset()
        hotel = self.request.query_params.get("hotel")
        city = self.request.query_params.get("city")
        max_price = self.request.query_params.get("max_price")
        room_type = self.request.query_params.get("room_type")

        if hotel:
            qs = qs.filter(hotel_id=hotel)
        if city:
            qs = qs.filter(hotel__city__iexact=city)
        if max_price:
            qs = qs.filter(price_per_night__lte=max_price)
        if room_type:
            qs = qs.filter(room_type__iexact=room_type)
        return qs

class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.all()  
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Booking.objects.filter(user=self.request.user).select_related("room", "room__hotel")

    @transaction.atomic
    def perform_create(self, serializer):
        booking = serializer.save(user=self.request.user)

        # --- Admin email ---
        subject_admin = "New booking received"
        text_admin = (
            f"User {booking.user.username} booked {booking.room.hotel.name} - "
            f"{booking.room.name} from {booking.check_in} to {booking.check_out}."
        )
        EmailMultiAlternatives(
            subject=subject_admin,
            body=text_admin,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[settings.EMAIL_HOST_USER],
        ).send(fail_silently=False)

        # --- User email ---
        subject_user = "Booking confirmation"
        html_user = render_to_string(
            "email/booking_confirmation.html",
            {"booking": booking, "user": booking.user}
        )
        msg_user = EmailMultiAlternatives(
            subject=subject_user,
            body="Your booking has been confirmed.",
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[booking.user.email],
        )
        msg_user.attach_alternative(html_user, "text/html")
        msg_user.send(fail_silently=False)
        self.booking_instance = booking  

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer) 

        booking = getattr(self, "booking_instance", None)

        headers = self.get_success_headers(serializer.data)
        return Response(
            {
                "message": "Room sucesfully booked",
                "booking": {
                    "id": booking.id,
                    "room": booking.room.name,
                    "hotel": booking.room.hotel.name,
                    "check_in": booking.check_in,
                    "check_out": booking.check_out,
                }
            },
            status=status.HTTP_201_CREATED,
            headers=headers,
        )

    @action(detail=True, methods=["post"])
    @transaction.atomic
    def cancel(self, request, pk=None):
        booking = self.get_object()
        if booking.user != request.user and not request.user.is_staff:
            return Response({"detail": "Forbidden"}, status=403)
        booking.status = "canceled"
        booking.save()
        return Response({"status": "canceled"})
    
class CustomAuthToken(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        username = request.data.get("username")
        password = request.data.get("password")
        if not username or not password:
            return Response({"error": "Please provide username and password"}, status=400)

        user = authenticate(username=username, password=password)
        if not user:
            return Response({"error": "Invalid credentials"}, status=400)

        token, created = Token.objects.get_or_create(user=user)
        return Response({"token": token.key, "username": user.username})