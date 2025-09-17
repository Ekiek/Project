from rest_framework import serializers
from .models import Hotel, Room, Booking
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email'),
            password=validated_data['password']
        )
        return user

class HotelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hotel
        fields = ['id', 'name', 'city', 'description', 'image_url']

class RoomSerializer(serializers.ModelSerializer):
    hotel = HotelSerializer(read_only=True)
    hotel_id = serializers.PrimaryKeyRelatedField(
        queryset=Hotel.objects.all(),
        source='hotel',
        write_only=True
    )

    class Meta:
        model = Room
        fields = [
            'id', 'hotel', 'hotel_id',
            'name', 'room_type',
            'price_per_night', 'image_url', 'description'
        ]


class BookingSerializer(serializers.ModelSerializer):
    room = serializers.PrimaryKeyRelatedField(queryset=Room.objects.all())
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    user = serializers.ReadOnlyField(source='user.username')  # მხოლოდ display

    class Meta:
        model = Booking
        fields = [
            'id', 'room', 'guest_name', 'guest_phone',
            'check_in', 'check_out', 'total_price', 'status', 'user'
        ]

    def validate(self, attrs):
        room = attrs.get('room')
        check_in = attrs.get('check_in')
        check_out = attrs.get('check_out')

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
            raise serializers.ValidationError("Room is already booked for these dates.")

        return attrs

    def create(self, validated_data):
        user = self.context['request'].user
        room = validated_data['room']
        check_in = validated_data['check_in']
        check_out = validated_data['check_out']
        nights = (check_out - check_in).days
        total_price = nights * room.price_per_night

        booking = Booking.objects.create(
            user=user,
            room=room,
            guest_name=validated_data['guest_name'],
            guest_phone=validated_data['guest_phone'],
            check_in=check_in,
            check_out=check_out,
            total_price=total_price
        )
        return booking

    def create(self, validated_data):
        user = self.context['request'].user
        return Booking.objects.create(user=user, **validated_data)

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["username", "email", "password"]

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email"),
            password=validated_data["password"]
        )
        return user