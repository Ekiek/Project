from django.contrib import admin
from .models import Hotel, Room, Booking

@admin.register(Hotel)
class HotelAdmin(admin.ModelAdmin):
    list_display = ('name','city')

@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ('name','hotel','room_type','price_per_night')

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('room','user','guest_name','check_in','check_out','status')
