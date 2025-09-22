import requests
from django.core.management.base import BaseCommand
from api.models import Hotel, Room

class Command(BaseCommand):
    help = "Import hotels and their rooms in one go"

    def handle(self, *args, **options):
        hotels_url = "https://hotelbooking.stepprojects.ge/api/Hotels/GetAll"
        response = requests.get(hotels_url)

        if response.status_code != 200:
            self.stdout.write(self.style.ERROR(f"❌ Failed hotels request: {response.status_code}"))
            return

        hotels_data = response.json()
        hotel_map = {}  

        for h in hotels_data:
            hotel, created = Hotel.objects.get_or_create(
                api_id=h.get("id"),
                defaults={
                    "name": h.get("name"),
                    "city": h.get("city", ""),
                    "description": h.get("description", ""),
                    "image_url": h.get("featuredImage", ""),
                }
            )
            hotel_map[h.get("id")] = hotel

            if created:
                self.stdout.write(self.style.SUCCESS(f"🏨 Added hotel: {hotel.name}"))
            else:
                self.stdout.write(self.style.WARNING(f"↔ Hotel exists: {hotel.name}"))

        rooms_url = "https://hotelbooking.stepprojects.ge/api/Rooms/GetAll"
        response = requests.get(rooms_url)

        if response.status_code != 200:
            self.stdout.write(self.style.ERROR(f"❌ Failed rooms request: {response.status_code}"))
            return

        rooms_data = response.json()

        for r in rooms_data:
            hotel_id = r.get("hotelId") 
            hotel = hotel_map.get(hotel_id)

            if not hotel:
                self.stdout.write(self.style.WARNING(f"⚠ Hotel not found for room: {r.get('name')} ({hotel_id})"))
                continue

            valid_room_types = dict(Room.ROOM_TYPES).keys()
            room_type = r.get("room_type", "single")
            if room_type not in valid_room_types:
                room_type = Room.SINGLE

            room, created = Room.objects.get_or_create(
                hotel=hotel,
                name=r.get("name", "Unnamed Room"),
                defaults={
                    "room_type": room_type,
                    "price_per_night": r.get("pricePerNight", 0),
                    "description": r.get("description", ""),
                    "image_url": r.get("images")[0]["source"] if r.get("images") else "",
                    "api_hotel_id": hotel_id,
                }
            )

            if created:
                self.stdout.write(self.style.SUCCESS(f"🛏️ Added room: {room.name}"))
            else:
                self.stdout.write(self.style.WARNING(f"↔ Room exists: {room.name}"))

        self.stdout.write(self.style.SUCCESS("✅ Hotels and Rooms import completed"))
