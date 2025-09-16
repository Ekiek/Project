# api/views.py
from rest_framework import viewsets, permissions
from .models import Hotel, Room, Booking
from .serializers import HotelSerializer, RoomSerializer, BookingSerializer
from rest_framework.decorators import action
from rest_framework.response import Response

class HotelViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Hotel.objects.all()
    serializer_class = HotelSerializer

class RoomViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Room.objects.select_related('hotel').all()
    serializer_class = RoomSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        room_type = self.request.query_params.get('type')
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        hotel = self.request.query_params.get('hotel')
        check_in = self.request.query_params.get('check_in')
        check_out = self.request.query_params.get('check_out')

        if room_type:
            qs = qs.filter(room_type=room_type)
        if min_price:
            qs = qs.filter(price_per_night__gte=min_price)
        if max_price:
            qs = qs.filter(price_per_night__lte=max_price)
        if hotel:
            qs = qs.filter(hotel_id=hotel)
        if check_in and check_out:
            # exclude rooms that have overlapping booked bookings
            qs = qs.exclude(
                bookings__status='booked',
                bookings__check_in__lt=check_out,
                bookings__check_out__gt=check_in
            )
        return qs

class BookingViewSet(viewsets.ModelViewSet):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return Booking.objects.select_related('room','room__hotel').all()
        return Booking.objects.select_related('room','room__hotel').filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    # optional cancel endpoint (PATCH)
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        booking = self.get_object()
        if booking.user != request.user and not request.user.is_staff:
            return Response({'detail':'Forbidden'}, status=403)
        booking.status = Booking.CANCELED
        booking.save()
        return Response({'status':'canceled'})
