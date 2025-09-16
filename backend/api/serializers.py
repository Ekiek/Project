# api/serializers.py
from rest_framework import serializers
from .models import Hotel, Room, Booking

class HotelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hotel
        fields = '__all__'

class RoomSerializer(serializers.ModelSerializer):
    hotel = HotelSerializer(read_only=True)
    hotel_id = serializers.PrimaryKeyRelatedField(queryset=Hotel.objects.all(), source='hotel', write_only=True)

    class Meta:
        model = Room
        fields = '__all__'

class BookingSerializer(serializers.ModelSerializer):
    room = RoomSerializer(read_only=True)
    room_id = serializers.PrimaryKeyRelatedField(queryset=Room.objects.all(), source='room', write_only=True)

    class Meta:
        model = Booking
        fields = ['id','room','room_id','guest_name','guest_phone','check_in','check_out','total_price','status','created_at']

    def validate(self, attrs):
        room = attrs.get('room')
        check_in = attrs.get('check_in')
        check_out = attrs.get('check_out')
        if check_in >= check_out:
            raise serializers.ValidationError("Check-out must be after check-in.")
        # overlapping bookings?
        overlapping = Booking.objects.filter(
            room=room,
            status='booked',
            check_in__lt=check_out,
            check_out__gt=check_in
        ).exists()
        if overlapping:
            raise serializers.ValidationError("Room is already booked for these dates.")
        return attrs

    def create(self, validated_data):
        user = self.context['request'].user
        booking = Booking.objects.create(user=user, **validated_data)
        return booking
