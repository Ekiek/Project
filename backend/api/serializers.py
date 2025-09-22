from rest_framework import serializers
from django.contrib.auth.models import User
from decimal import Decimal
from .models import Hotel, Room, Booking

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password']

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )

class HotelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hotel
        fields = ['id', 'name', 'city', 'description', 'image_url']

class RoomSerializer(serializers.ModelSerializer):
    hotel_name = serializers.CharField(source='hotel.name', read_only=True)
    hotel_id = serializers.PrimaryKeyRelatedField(
        queryset=Hotel.objects.all(),
        source='hotel',
        write_only=True
    )

    class Meta:
        model = Room
        fields = ['id', 'name', 'room_type', 'price_per_night', 'image_url', 'description', 'hotel', 'hotel_name', 'hotel_id']

class BookingSerializer(serializers.ModelSerializer):
    room = serializers.PrimaryKeyRelatedField(queryset=Room.objects.all())
    room_name = serializers.CharField(source='room.name', read_only=True)
    hotel_name = serializers.CharField(source='room.hotel.name', read_only=True)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    user = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = Booking  # სწორად Booking მოდელი
        fields = ['id', 'room', 'room_name', 'hotel_name', 'guest_name', 'guest_phone', 'check_in', 'check_out', 'total_price', 'user']

    def validate(self, attrs):
        room = attrs['room']
        check_in = attrs['check_in']
        check_out = attrs['check_out']

        if check_in >= check_out:
            raise serializers.ValidationError("Check-out must be after check-in.")

        overlapping = Booking.objects.filter(
            room=room,
            status='booked',
            check_in__lt=check_out,
            check_out__gt=check_in
        )
        if self.instance:
            overlapping = overlapping.exclude(pk=self.instance.pk)

        if overlapping.exists():
            raise serializers.ValidationError({"room": "This room is already booked for these dates."})
        return attrs

    def create(self, validated_data):
        user = self.context['request'].user
        room = validated_data['room']
        nights = (validated_data['check_out'] - validated_data['check_in']).days
        total_price = Decimal(nights) * room.price_per_night
        return Booking.objects.create(
            user=user,
            room=room,
            guest_name=validated_data['guest_name'],
            guest_phone=validated_data['guest_phone'],
            check_in=validated_data['check_in'],
            check_out=validated_data['check_out'],
            total_price=total_price
        )

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.full_clean()
        instance.save()
        return instance