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
from rest_framework.renderers import JSONRenderer
from rest_framework.decorators import action

def send_booking_email(subject, template_name, context, recipients):
    """Reusable function for sending HTML emails"""
    html_content = render_to_string(template_name, context)
    msg = EmailMultiAlternatives(
        subject=subject,
        body="This is an HTML email.",  # fallback text
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=recipients,
    )
    msg.attach_alternative(html_content, "text/html")
    msg.send(fail_silently=True)


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

class BookingViewSet(viewsets.ModelViewSet):
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        return Booking.objects.filter(user=self.request.user).select_related(
            "room", "room__hotel"
        )

    @transaction.atomic
    def perform_create(self, serializer):
        booking = serializer.save(user=self.request.user)

      
        send_booking_email(
            "New booking received",
            "email/booking_admin.html",
            {"booking": booking, "user": booking.user},
            [settings.EMAIL_HOST_USER],
        )

        send_booking_email(
            "Booking confirmation",
            "email/booking_confirmation.html",
            {"booking": booking, "user": booking.user},
            [booking.user.email],
        )

        self.booking_instance = booking

    def create(self, request, *args, **kwargs):
        """Custom response with booking summary"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        booking = getattr(self, "booking_instance", None)
        headers = self.get_success_headers(serializer.data)

        data = {
                "message": "Room successfully booked",
                "booking": {
                    "id": booking.id,
                    "room": booking.room.name,
                    "hotel": booking.room.hotel.name,
                    "check_in": booking.check_in,
                    "check_out": booking.check_out,
                },
            }
        return Response(
        data,
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
        else:
            booking.delete()

        send_booking_email(
            "Booking Canceled",
            "email/booking_canceled.html",
            {"booking": booking, "user": booking.user},
            [booking.user.email, settings.EMAIL_HOST_USER],
        )

        return Response({"status": "canceled"})

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        booking = self.get_object()

        send_booking_email(
            "Booking Updated",
            "email/booking_updated.html",
            {"booking": booking, "user": booking.user},
            [booking.user.email, settings.EMAIL_HOST_USER],
        )
        return response


    @action(detail=False, methods=["post"], permission_classes=[IsAuthenticated])
    def check_availability(self, request):
        room_id = request.data.get("room")
        check_in = request.data.get("check_in")
        check_out = request.data.get("check_out")
        booking_id = request.data.get("booking_id")

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

    @action(detail=False, methods=["get"], permission_classes=[AllowAny])
    def room_bookings(self, request):
        """
        Returns all bookings for a given room (check_in, check_out).
        Used by frontend calendar to disable booked dates.
        """
        room_id = request.query_params.get("room")
        if not room_id:
            return Response({"detail": "Missing room id"}, status=400)

        bookings = Booking.objects.filter(room_id=room_id).values(
            "check_in", "check_out"
        )
        return Response(list(bookings))