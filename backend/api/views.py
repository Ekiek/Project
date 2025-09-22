from django.contrib.auth.models import User
from django.db import transaction
from django.conf import settings
from django.template.loader import render_to_string
from django.core.mail import EmailMultiAlternatives
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, generics, permissions, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import action

from .models import Hotel, Room, Booking
from .serializers import HotelSerializer, RoomSerializer, BookingSerializer, UserSerializer
from .filters import HotelFilter, RoomFilter


# --- User registration ---
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]


# --- Current logged-in user ---
class CurrentUserView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


# --- Hotels ---
class HotelViewSet(viewsets.ModelViewSet):
    queryset = Hotel.objects.all()
    serializer_class = HotelSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = HotelFilter
    permission_classes = [permissions.AllowAny]


# --- Rooms ---
class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = RoomFilter
    permission_classes = [permissions.AllowAny]


# --- Bookings ---
class BookingViewSet(viewsets.ModelViewSet):
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Logged-in user sees only their bookings
        return Booking.objects.filter(user=self.request.user).select_related(
            "room", "room__hotel"
        )

    @transaction.atomic
    def perform_create(self, serializer):
        # Create booking and attach user
        booking = serializer.save(user=self.request.user)

        # --- Debug print ---
        print(f"Booking created: {booking.room.name} from {booking.check_in} to {booking.check_out}.")

        # --- Admin email notification ---
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
        ).send(fail_silently=True)

        # --- User email confirmation ---
        subject_user = "Booking confirmation"
        html_user = render_to_string(
            "email/booking_confirmation.html",
            {"booking": booking, "user": booking.user},
        )
        msg_user = EmailMultiAlternatives(
            subject=subject_user,
            body="Your booking has been confirmed.",
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[booking.user.email],
        )
        msg_user.attach_alternative(html_user, "text/html")
        msg_user.send(fail_silently=True)

        self.booking_instance = booking

    def create(self, request, *args, **kwargs):
        """Custom create to return booking summary"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        booking = getattr(self, "booking_instance", None)
        headers = self.get_success_headers(serializer.data)

        return Response(
            {
                "message": "Room successfully booked",
                "booking": {
                    "id": booking.id,
                    "room": booking.room.name,       # შეცვლილია number -> name
                    "hotel": booking.room.hotel.name,
                    "check_in": booking.check_in,
                    "check_out": booking.check_out,
                },
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

        if hasattr(booking, "status"):
            booking.status = "canceled"
            booking.save()
            return Response({"status": "canceled"})
        else:
            booking.delete()
            return Response({"status": "deleted"})
    @action(detail=False, methods=["post"], permission_classes=[IsAuthenticated])
    def check_availability(self, request):
        room_id = request.data.get("room")
        check_in = request.data.get("check_in")
        check_out = request.data.get("check_out")
        booking_id = request.data.get("booking_id")  # თუ current booking–ს ვაკეთებთ modify

        if not room_id or not check_in or not check_out:
            return Response({"detail": "Missing parameters"}, status=status.HTTP_400_BAD_REQUEST)

        qs = Booking.objects.filter(
            room_id=room_id,
            check_in__lt=check_out,
            check_out__gt=check_in,
        )

        if booking_id:
            qs = qs.exclude(id=booking_id)

        available = not qs.exists()
        return Response({"available": available})