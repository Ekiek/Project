from django.db import models
from django.conf import settings
from decimal import Decimal
from django.core.exceptions import ValidationError


class Hotel(models.Model):
    name = models.CharField(max_length=200)
    city = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    image_url = models.URLField(blank=True, null=True)

    def __str__(self):
        return f"{self.name} ({self.city})"


class Room(models.Model):
    SINGLE = "single"
    DOUBLE = "double"
    DELUXE = "deluxe"
    SUITE = "suite"
    FAMILY = "family"

    ROOM_TYPES = [
        (SINGLE, "Single Room"),
        (DOUBLE, "Double Room"),
        (DELUXE, "Deluxe Room"),
        (SUITE, "Suite Room"),
        (FAMILY, "Family Room"),
    ]

    hotel = models.ForeignKey(Hotel, related_name="rooms", on_delete=models.CASCADE)
    name = models.CharField(max_length=200)
    room_type = models.CharField(max_length=10, choices=ROOM_TYPES)
    price_per_night = models.DecimalField(max_digits=8, decimal_places=2)
    image_url = models.URLField(blank=True, null=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return f"{self.name} - {self.hotel.name}"


class Booking(models.Model):
    BOOKED = "booked"
    CANCELED = "canceled"
    STATUS_CHOICES = [(BOOKED, "Booked"), (CANCELED, "Canceled")]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, related_name="bookings", on_delete=models.CASCADE
    )
    room = models.ForeignKey(Room, related_name="bookings", on_delete=models.CASCADE)
    guest_name = models.CharField(max_length=200)
    guest_phone = models.CharField(max_length=50)
    check_in = models.DateField()
    check_out = models.DateField()
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=BOOKED)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.room.hotel.name} ({self.check_in} → {self.check_out})"

    def clean(self):
        # Room overlapping check
        overlaps = Booking.objects.filter(
            room=self.room,
            status=Booking.BOOKED,
            check_in__lt=self.check_out,
            check_out__gt=self.check_in,
        )
        if self.pk:
            overlaps = overlaps.exclude(pk=self.pk)
        if overlaps.exists():
            raise ValidationError(
                {"room": "This room is already booked for the selected dates."}
            )

    def save(self, *args, **kwargs):
        self.full_clean()
        nights = (self.check_out - self.check_in).days
        if nights < 1:
            raise ValidationError(
                {"check_out": "Check-out date must be at least 1 day after check-in"}
            )
        self.total_price = Decimal(nights) * self.room.price_per_night
        super().save(*args, **kwargs)
