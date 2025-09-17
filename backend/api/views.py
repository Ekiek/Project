from django.template.loader import render_to_string
from django.contrib.auth.models import User
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from django.db import transaction
from rest_framework import viewsets, generics, permissions
from rest_framework.serializers import ModelSerializer
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.views import APIView
from .models import Booking, Room, Hotel
from .serializers import BookingSerializer, RoomSerializer, HotelSerializer, UserSerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]

class HotelViewSet(viewsets.ModelViewSet):
    queryset = Hotel.objects.all()
    serializer_class = HotelSerializer
    pagination_class = None  


class RoomViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Room.objects.select_related('hotel').all()
    serializer_class = RoomSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        hotel = self.request.query_params.get('hotel')
        room_type = self.request.query_params.get('type')
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        check_in = self.request.query_params.get('check_in')
        check_out = self.request.query_params.get('check_out')

        if hotel:
            qs = qs.filter(hotel_id=hotel)
        if room_type:
            qs = qs.filter(room_type=room_type)
        if min_price:
            qs = qs.filter(price_per_night__gte=min_price)
        if max_price:
            qs = qs.filter(price_per_night__lte=max_price)
        if check_in and check_out:
            qs = qs.exclude(
                bookings__status='booked',
                bookings__check_in__lt=check_out,
                bookings__check_out__gt=check_in
            )
        return qs

class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save()

    @transaction.atomic
    def perform_create(self, serializer):
        booking = serializer.save(user=self.request.user)

        subject_admin = "New booking received"
        text_admin = f"User {booking.user.username} ({booking.user.email}) booked {booking.room.hotel.name} - {booking.room.name} from {booking.check_in} to {booking.check_out}."
        EmailMultiAlternatives(
            subject=subject_admin,
            body=text_admin,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[settings.EMAIL_HOST_USER],
        ).send(fail_silently=False)

        subject_user = "Your booking has been successfully created"
        text_user = f"Hello {booking.user.username}, your booking has been successfully created."
        html_user = render_to_string(
            "email/booking_confirmation.html",
            {"booking": booking, "user": booking.user}
        )
        msg_user = EmailMultiAlternatives(
            subject=subject_user,
            body=text_user,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[booking.user.email],
        )
        msg_user.attach_alternative(html_user, "text/html")
        msg_user.send(fail_silently=False)

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def cancel(self, request, pk=None):
        booking = self.get_object()
        if booking.user != request.user and not request.user.is_staff:
            return Response({'detail': 'Forbidden'}, status=403)

        booking.status = Booking.CANCELED
        booking.save()

        # Email admin
        subject_admin = "Booking has been canceled"
        text_admin = f"User {booking.user.username} ({booking.user.email}) has canceled booking {booking.room.hotel.name} - {booking.room.name}."
        EmailMultiAlternatives(
            subject=subject_admin,
            body=text_admin,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[settings.EMAIL_HOST_USER],
        ).send(fail_silently=False)

        # Email user
        subject_user = "Your booking has been canceled"
        text_user = f"Hello {booking.user.username}, your booking has been canceled."
        html_user = render_to_string(
            "email/booking_canceled.html",
            {"booking": booking, "user": booking.user}
        )
        msg_user = EmailMultiAlternatives(
            subject=subject_user,
            body=text_user,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[booking.user.email],
        )
        msg_user.attach_alternative(html_user, "text/html")
        msg_user.send(fail_silently=False)

        return Response({'status': 'canceled'})

class RegisterSerializer(ModelSerializer):
    class Meta:
        model = User
        fields = ("username", "password", "email")
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email", ""),
            password=validated_data["password"]
        )
        return user


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]