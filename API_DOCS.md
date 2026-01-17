# API Documentation

## 1. Search & Filtering

### Search PGs
**Endpoint**: `GET /api/pgs`

**Query Parameters**:
- `search`: String (searches name, location, address)
- `type`: String ("Boys", "Girls", "Co-living")
- `minPrice`: Number
- `maxPrice`: Number
- `amenities`: String (comma-separated, e.g., "wifi,ac,food")

**Example**:
`GET /api/pgs?search=Pune&type=Boys&minPrice=3000&maxPrice=8000&amenities=wifi,food`

### Search Messes
**Endpoint**: `GET /api/messes`

**Query Parameters**:
- `search`: String (searches name, address)
- `type`: String ("veg", "non-veg")

**Example**:
`GET /api/messes?search=Kothrud&type=veg`

---

## 2. Favorites / Wishlist

### Toggle Favorite
**Endpoint**: `POST /api/favorites/toggle`
**Auth**: Required (Bearer Token)

**Payload**:
```json
{
  "listingId": "65a1b2c3d4e5f6...", 
  "type": "PG" // or "MESS"
}
```

**Response**:
```json
{
  "isFavorite": true, // or false if removed
  "message": "Added to favorites"
}
```

### Get Favorites
**Endpoint**: `GET /api/favorites`
**Auth**: Required (Bearer Token)

**Response**: Array of favorite objects
```json
[
  {
    "favoriteId": "...",
    "listingId": "...",
    "type": "PG",
    "name": "Sunshine PG",
    "location": "Kothrud",
    "price": 5000,
    "image": "url..."
  }
]
```

### Check Favorite Status
**Endpoint**: `GET /api/favorites/check/:listingId`
**Auth**: Optional (Returns false if not logged in)

**Response**:
```json
{
  "isFavorite": true
}
```

---

## 3. User Profile Management

### Update Profile
**Endpoint**: `PATCH /api/users/me`
**Auth**: Required (Bearer Token)

**Payload**: (Any combination of fields)
```json
{
  "name": "New Name",
  "phone": "9876543210",
  "address": "123 Main St, Pune",
  "gender": "male", // "female", "other"
  "profileImage": "https://res.cloudinary.com/..."
}
```

**Response**:
```json
{
  "message": "Profile updated successfully",
  "user": { ...updated user object... }
}
```
