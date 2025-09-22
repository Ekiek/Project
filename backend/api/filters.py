# api/filters.py
import django_filters
from .models import Hotel, Room

class HotelFilter(django_filters.FilterSet):
    city = django_filters.CharFilter(field_name="city", lookup_expr="iexact")

    class Meta:
        model = Hotel
        fields = ['city']

class RoomFilter(django_filters.FilterSet):
    hotel = django_filters.NumberFilter(field_name="hotel__id", lookup_expr='exact')
    city = django_filters.CharFilter(field_name="hotel__city", lookup_expr="iexact")
    max_price = django_filters.NumberFilter(field_name="price_per_night", lookup_expr="lte")
    room_type = django_filters.CharFilter(field_name="room_type", lookup_expr="iexact")

    class Meta:
        model = Room
        fields = ['hotel', 'city', 'max_price', 'room_type']
