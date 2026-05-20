# Ilaka Backend API Documentation

## Table of Contents
1. [Base URL & Overview](#base-url--overview)
2. [Authentication](#authentication)
3. [Error Responses](#error-responses)
4. [Rate Limiting](#rate-limiting)
5. [Pagination](#pagination)
6. [Endpoints](#endpoints)
   - [Auth](#1-auth)
   - [Users](#2-users)
   - [Events](#3-events)
   - [Payments](#4-payments)
   - [Tickets](#5-tickets)
   - [Social](#6-social)
   - [Feed](#7-feed)
   - [Communities](#8-communities)
   - [Chat](#9-chat)
   - [Notifications](#10-notifications)
   - [Gamification](#11-gamification)
   - [Uploads](#12-uploads)
   - [AI Search](#13-ai-search)
   - [Admin](#14-admin)
   - [Companies](#15-companies)
   - [API Keys](#16-api-keys)
   - [Geo](#17-geo)
   - [Health](#18-health)
   - [Cron](#19-cron)
   - [WebSocket](#20-websocket)
7. [Common Field Types](#common-field-types)
8. [Gamification Reference](#gamification-reference)

---

## Base URL & Overview

```
Base URL:  /api/v1
Swagger:   /docs
ReDoc:     /redoc
OpenAPI:   /openapi.json
```

All endpoints return JSON unless otherwise noted (PDF download, WebSocket).

---

## Authentication

The API supports two authentication methods. Both are interchangeable — any endpoint that accepts JWT also accepts an API key.

### 1. JWT Bearer Token (user sessions)

```http
Authorization: Bearer <access_token>
```

Obtain tokens via `POST /api/v1/auth/login`. The access token expires in 30 minutes by default; use the refresh token to get a new one.

**Token payload:**
```json
{
  "sub": "<user_id>",
  "role": "USER | ORGANIZER | ADMIN",
  "type": "access",
  "exp": 1748000000,
  "iat": 1747998200
}
```

### 2. API Key (B2B / server-to-server)

```http
x-api-key: ik_<64-hex-chars>
```

API keys are scoped to a company and authenticate as that company's service user (ORGANIZER role). Manage keys via the `/api/v1/keys` and `/api/v1/companies` endpoints.

### 3. WebSocket Auth

Append the access token as a query parameter:
```
ws://host/ws?token=<access_token>
```

### Roles

| Role | Permissions |
|------|-------------|
| `USER` | Standard member — browse, RSVP, post, chat |
| `ORGANIZER` | USER + create events, manage companies, upload to restricted folders |
| `ADMIN` | Full access — manage all users, events, companies |

---

## Error Responses

All errors follow this shape:

```json
{ "detail": "Human-readable description" }
```

| Status | Meaning |
|--------|---------|
| 400 | Bad request / invalid input |
| 401 | Missing or invalid authentication |
| 403 | Authenticated but not authorized |
| 404 | Resource not found |
| 409 | Conflict (duplicate, constraint violation) |
| 422 | Validation error (Pydantic field errors) |
| 429 | Rate limit exceeded |
| 503 | Database unavailable |

---

## Rate Limiting

Rate limits are enforced per user (or IP for anonymous calls). When exceeded, the API returns HTTP 429. Limits are noted on each endpoint. Redis is used when available; an in-memory LRU fallback is used otherwise.

---

## Pagination

Cursor-based pagination is used throughout:

| Field | Type | Description |
|-------|------|-------------|
| `cursor` | `string \| null` | Pass `next_cursor` from the previous response |
| `limit` | `int` | Items per page (each endpoint documents its default and range) |
| `next_cursor` | `string \| null` | Cursor for the next page; `null` means no more pages |
| `has_more` | `bool` | Whether a next page exists |

---

## Endpoints

---

### 1. Auth

**Prefix:** `/api/v1/auth`

---

#### `POST /register`
Create a new account.

**Rate limit:** 5 req / 60 s per IP

**Request body:**
```json
{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "Secure@123"
}
```

| Field | Type | Rules |
|-------|------|-------|
| `name` | string | 2–100 chars |
| `email` | string (email) | normalized to lowercase |
| `password` | string | 8+ chars, 1 uppercase, 1 digit, 1 special char |

**Response `201`:**
```json
{ "id": "uuid" }
```

---

#### `POST /login`
Obtain access and refresh tokens.

**Rate limit:** 10 req / 60 s per IP

**Request body:**
```json
{
  "email": "alice@example.com",
  "password": "Secure@123",
  "remember_me": true
}
```

**Response `200`:**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer"
}
```

`remember_me: true` extends the refresh token TTL to `JWT_REFRESH_TOKEN_EXPIRE_DAYS` (default 7 days); `false` gives 1 day.

---

#### `POST /refresh`
Exchange a refresh token for a new token pair.

**Request body:**
```json
{ "refresh_token": "eyJ..." }
```

**Response `200`:** Same shape as `/login`.

---

#### `POST /logout`
Stateless logout — client must discard tokens locally.

**Response `204`:** No content.

---

#### `GET /me`
Get the authenticated user's profile.

**Auth:** Required

**Response `200`:**
```json
{
  "id": "uuid",
  "name": "Alice",
  "email": "alice@example.com",
  "role": "USER",
  "latitude": 12.9716,
  "longitude": 77.5946,
  "radius_preference": 10000,
  "subscription_type": null,
  "stripe_customer_id": null
}
```

---

#### `POST /forgot-password`
Trigger a password-reset email.

**Rate limit:** 5 req / 60 s per IP

**Request body:**
```json
{ "email": "alice@example.com" }
```

**Response `200`:**
```json
{ "ok": true }
```

---

#### `POST /reset-password`
Set a new password using the token from the reset email.

**Request body:**
```json
{
  "token": "<reset-token-from-email>",
  "password": "NewSecure@456"
}
```

**Response `200`:**
```json
{ "ok": true }
```

---

### 2. Users

**Prefix:** `/api/v1/users`  
**Auth:** All endpoints require authentication.

---

#### `POST /profile`
Update name or radius preference.

**Request body:**
```json
{
  "name": "Alice B.",
  "radius_preference": 5000
}
```

Both fields are optional. **Response `200`:** `{ "ok": true }`

---

#### `POST /location`
Update the user's current coordinates.

**Request body:**
```json
{
  "latitude": 12.9716,
  "longitude": 77.5946,
  "radius": 8000
}
```

**Response `200`:** `{ "ok": true }`

---

#### `GET /my-events`
All events the user has RSVPed to, split into upcoming and past.

**Response `200`:**
```json
{
  "upcoming": [
    {
      "id": "uuid",
      "title": "Hackathon",
      "start_time": "2026-06-01T10:00:00",
      "end_time": "2026-06-01T18:00:00",
      "capacity": 100,
      "rsvp_count": 42,
      "visibility": "PUBLIC",
      "engagement_score": 87.5
    }
  ],
  "past": []
}
```

---

#### `GET /members`
List all platform members (admin/organizer view).

**Response `200`:**
```json
{
  "members": [
    { "id": "uuid", "name": "Alice", "email": "alice@example.com", "role": "USER", "created_at": "..." }
  ],
  "total_members": 1
}
```

---

### 3. Events

**Prefix:** `/api/v1/events`

---

#### `GET /`
Discover nearby events.

**Auth:** Open (optional JWT for enhanced ranking)  
**Rate limit:** 120 req / 60 s per geo-grid cell

**Query params:**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `lat` | float | Yes | — | Latitude (-90 to 90) |
| `lng` | float | Yes | — | Longitude (-180 to 180) |
| `radius` | float | No | 10000 | Search radius in metres (min 500) |

**Response `200`:**
```json
{
  "events": [
    {
      "id": "uuid",
      "title": "Startup Mixer",
      "description": "...",
      "banner_url": "https://res.cloudinary.com/...",
      "badge_icon": "🚀",
      "latitude": 12.9716,
      "longitude": 77.5946,
      "start_time": "2026-06-01T18:00:00",
      "end_time": "2026-06-01T21:00:00",
      "visibility": "PUBLIC",
      "capacity": 50,
      "organizer_id": "uuid",
      "is_paid": false,
      "ticket_price": null,
      "engagement_score": 91.2,
      "event_type": "PHYSICAL",
      "online_link": null,
      "created_at": "..."
    }
  ]
}
```

---

#### `POST /`
Create an event.

**Auth:** Required  
**Rate limit:** 10 req / 60 s per user

**Request body:**
```json
{
  "title": "Startup Mixer",
  "description": "Monthly meetup for founders and builders.",
  "latitude": 12.9716,
  "longitude": 77.5946,
  "start_time": "2026-06-01T18:00:00",
  "end_time": "2026-06-01T21:00:00",
  "visibility": "PUBLIC",
  "capacity": 50,
  "is_paid": false,
  "event_type": "PHYSICAL",
  "banner_url": null,
  "badge_icon": null,
  "ticket_price": null,
  "payment_qr_url": null,
  "online_link": null,
  "link_share_mode": "INVITE_ONLY"
}
```

| Field | Type | Rules |
|-------|------|-------|
| `title` | string | 3–200 chars |
| `description` | string | 10–5000 chars |
| `visibility` | string | `PUBLIC` or `PRIVATE` |
| `capacity` | int | positive integer |
| `ticket_price` | float | required if `is_paid: true` |
| `online_link` | string | required if `event_type: "ONLINE"` |

**Response `201`:** Full event object.

---

#### `GET /mine`
Events created by the authenticated user.

**Auth:** Required

**Response `200`:**
```json
{
  "events": [
    { "id": "uuid", "title": "...", "start_time": "...", "end_time": "...", "capacity": 50, "rsvp_count": 12, "visibility": "PUBLIC", "engagement_score": 45.0 }
  ]
}
```

---

#### `GET /{event_id}`
Get a single event.

**Auth:** Optional. For private events, pass the share token:
```http
x-share-token: <token-from-invite-endpoint>
```

**Response `200`:** Full event object.

---

#### `PUT /{event_id}`
Update an event (organizer or admin only).

**Auth:** Required

**Request body** (all fields optional):
```json
{
  "title": "Updated Title",
  "description": "...",
  "visibility": "PUBLIC",
  "capacity": 100,
  "start_time": "2026-06-02T18:00:00",
  "end_time": "2026-06-02T21:00:00"
}
```

**Response `200`:** Updated event object.

---

#### `DELETE /{event_id}`
Delete an event (organizer or admin only).

**Auth:** Required  
**Response `200`:** `{ "ok": true }`

---

#### `POST /{event_id}/rsvp`
RSVP to an event.

**Auth:** Required

**Response `201`:** RSVP confirmation with ticket details (for paid events, includes ticket ID and QR code).

---

#### `POST /{event_id}/share`
Record a share (analytics).

**Auth:** Required  
**Response `200`:** `{ "ok": true }`

---

#### `POST /{event_id}/invite`
Generate a shareable link token for a private event.

**Auth:** Required (organizer or admin only)

**Response `200`:**
```json
{ "token": "a1b2c3d4-..." }
```

Pass this token in `x-share-token` header when calling `GET /events/{event_id}`.

---

### 4. Payments

**Prefix:** `/api/v1/payments`

---

#### `POST /initiate`
Create a Razorpay order.

**Auth:** Required

**Request body:**
```json
{
  "reason": "event_ticket",
  "currency": "INR",
  "event_id": "uuid"
}
```

**Response `200`:**
```json
{
  "order_id": "order_ABC123",
  "key_id": "rzp_live_...",
  "amount": 49900,
  "currency": "INR",
  "upi_vpa": null,
  "provider": "razorpay"
}
```

Use `order_id` and `key_id` to open the Razorpay checkout in your frontend.

---

#### `POST /webhook/razorpay`
Razorpay webhook receiver. Called by Razorpay, not your frontend.

**Auth:** HMAC signature verification via `x-razorpay-signature` header.  
**Response `200`:** `{ "received": true }`

---

#### `POST /stripe/checkout`
Create a Stripe Checkout session.

**Auth:** Required

**Request body:**
```json
{
  "reason": "event_ticket",
  "event_id": "uuid",
  "success_url": "https://yourapp.com/payment/success",
  "cancel_url": "https://yourapp.com/payment/cancel"
}
```

**Response `200`:**
```json
{
  "checkout_url": "https://checkout.stripe.com/...",
  "session_id": "cs_test_..."
}
```

Redirect the user to `checkout_url`.

---

#### `POST /webhook/stripe`
Stripe webhook receiver. Called by Stripe, not your frontend.

**Auth:** `stripe-signature` header verification.  
**Response `200`:** `{ "received": true }`

---

### 5. Tickets

**Prefix:** `/api/v1/tickets`  
**Auth:** All endpoints require authentication (RSVP owner, event organizer, or admin).

---

#### `GET /{rsvp_id}`
Get ticket details.

**Response `200`:** Full ticket object with RSVP info, QR code data, and event details.

---

#### `GET /{rsvp_id}/pdf`
Download ticket as PDF.

**Response `200`:**  
Content-Type: `application/pdf`  
Binary PDF stream. Suitable for direct browser download.

---

### 6. Social

**Prefix:** `/api/v1/social`

---

#### `POST /users/{user_id}/follow`
Follow a user.

**Auth:** Required

**Response `200`:**
```json
{
  "following": true,
  "follower_count": 102,
  "following_count": 55
}
```

---

#### `DELETE /users/{user_id}/follow`
Unfollow a user.

**Auth:** Required  
**Response `200`:** Same shape as follow, with `following: false`.

---

#### `GET /users/{user_id}/profile`
Get a user's public profile.

**Auth:** Optional (pass JWT to get `is_following` field)

**Response `200`:**
```json
{
  "id": "uuid",
  "name": "Alice",
  "avatar_url": "https://...",
  "bio": "Builder. Traveller.",
  "interests": ["tech", "music"],
  "social_links": { "twitter": "https://twitter.com/alice" },
  "location_label": "Bengaluru",
  "xp": 1250,
  "level": 5,
  "streak_days": 7,
  "follower_count": 102,
  "following_count": 55,
  "post_count": 28,
  "event_count": 3,
  "is_following": false,
  "created_at": "..."
}
```

---

#### `GET /users/{user_id}/followers`
List a user's followers.

**Auth:** Open

**Query params:** `cursor`, `limit` (1–50, default 20)

**Response `200`:**
```json
{
  "users": [{ "id": "uuid", "name": "Bob", "avatar_url": "...", "level": 3 }],
  "next_cursor": null
}
```

---

#### `GET /users/{user_id}/following`
List who a user follows. Same shape as followers.

---

#### `GET /users/{user_id}/mutual-follows`
List users that both you and `{user_id}` follow.

**Auth:** Required  
**Response `200`:** `{ "users": [ { "id", "name", "avatar_url" } ] }`

---

### 7. Feed

**Prefix:** `/api/v1/feed`

---

#### `GET /`
Paginated post timeline.

**Auth:** Optional

**Query params:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `tab` | string | `for_you` | `for_you`, `following`, `nearby`, `trending` |
| `cursor` | string | null | Pagination cursor |
| `lat` | float | null | Required for `nearby` tab |
| `lng` | float | null | Required for `nearby` tab |
| `radius` | float | 10000 | Metres (1000–100000) |

**Response `200`:**
```json
{
  "posts": [
    {
      "id": "uuid",
      "author": { "id": "uuid", "name": "Alice", "avatar_url": "...", "level": 5 },
      "post_type": "TEXT",
      "visibility": "PUBLIC",
      "body": "This event was amazing!",
      "media_urls": [],
      "like_count": 14,
      "comment_count": 3,
      "repost_count": 1,
      "bookmark_count": 2,
      "hashtags": ["tech", "startup"],
      "user_reaction": null,
      "is_bookmarked": false,
      "created_at": "..."
    }
  ],
  "next_cursor": "2026-05-01T10:00:00",
  "has_more": true
}
```

---

#### `POST /posts`
Create a post.

**Auth:** Required

**Request body:**
```json
{
  "post_type": "TEXT",
  "visibility": "PUBLIC",
  "body": "Just discovered this amazing event nearby!",
  "hashtags": ["tech", "startup"],
  "event_id": null,
  "community_id": null,
  "media_urls": [],
  "poll_data": null
}
```

| Field | Values |
|-------|--------|
| `post_type` | `TEXT`, `MEDIA`, `POLL`, `REPOST` |
| `visibility` | `PUBLIC`, `PRIVATE`, `FOLLOWERS_ONLY` |
| `hashtags` | max 10 |
| `body` | max 5000 chars |

**Response `201`:** Full post object (same shape as feed item).

---

#### `PUT /posts/{post_id}`
Edit a post (author only).

**Auth:** Required

**Request body:**
```json
{
  "body": "Updated caption",
  "visibility": "FOLLOWERS_ONLY"
}
```

**Response `200`:** Updated post object.

---

#### `DELETE /posts/{post_id}`
Delete a post (author or admin).

**Auth:** Required  
**Response `204`:** No content.

---

#### `POST /posts/{post_id}/react`
Add or change a reaction.

**Auth:** Required

**Request body:**
```json
{ "reaction_type": "LIKE" }
```

**Response `200`:**
```json
{
  "post_id": "uuid",
  "reaction_type": "LIKE",
  "like_count": 15
}
```

---

#### `DELETE /posts/{post_id}/react`
Remove a reaction.

**Auth:** Required  
**Response `200`:** `{ "post_id": "...", "reaction_type": null, "like_count": 14 }`

---

#### `POST /posts/{post_id}/bookmark`
Toggle bookmark on a post.

**Auth:** Required  
**Response `200`:** Bookmark state.

---

#### `GET /saved`
Bookmarked posts for the authenticated user.

**Auth:** Required  
**Query params:** `cursor`  
**Response `200`:** Same shape as feed response.

---

#### `POST /posts/{post_id}/comments`
Add a comment (or reply to a comment).

**Auth:** Required

**Request body:**
```json
{
  "body": "Great point!",
  "parent_id": null
}
```

`parent_id` — set to a comment's ID to make it a nested reply.

**Response `201`:**
```json
{
  "id": "uuid",
  "author": { "id": "uuid", "name": "Alice", "avatar_url": "...", "level": 5 },
  "body": "Great point!",
  "like_count": 0,
  "reply_count": 0,
  "parent_id": null,
  "replies": [],
  "created_at": "..."
}
```

---

#### `GET /posts/{post_id}/comments`
List comments on a post.

**Auth:** Open  
**Query params:** `cursor`, `limit` (1–50, default 20)

**Response `200`:**
```json
{
  "comments": [ /* CommentResponse objects */ ],
  "next_cursor": null
}
```

---

### 8. Communities

**Prefix:** `/api/v1/communities`

Communities are auto-created per event. Each event has one linked community.

---

#### `GET /{community_id}`
Get community info.

**Auth:** Optional

**Response `200`:**
```json
{
  "id": "uuid",
  "event_id": "uuid",
  "name": "Startup Mixer Community",
  "description": "...",
  "cover_url": null,
  "is_open": true,
  "member_count": 42,
  "is_member": false,
  "user_role": null,
  "created_at": "..."
}
```

---

#### `POST /{community_id}/join`
Join a community.

**Auth:** Required  
**Response `200`:** `{ "joined": true, "role": "MEMBER", "member_count": 43 }`

---

#### `POST /{community_id}/leave`
Leave a community.

**Auth:** Required  
**Response `200`:** `{ "joined": false, "role": null, "member_count": 42 }`

---

#### `GET /{community_id}/feed`
Posts in this community.

**Auth:** Optional  
**Query params:** `cursor`  
**Response `200`:** Same shape as `/feed` response.

---

#### `POST /{community_id}/posts`
Post into a community (must be a member).

**Auth:** Required  
**Request body:** Same as `POST /feed/posts`  
**Response `201`:** Post object.

---

#### `PATCH /{community_id}/members/{user_id}/role`
Change a member's role (community admin only).

**Auth:** Required  
**Query param:** `role` — `MEMBER`, `MODERATOR`, or `ADMIN`  
**Response `200`:** `{ "ok": true }`

---

#### `POST /{community_id}/members/{user_id}/ban`
Ban a member (community admin only).

**Auth:** Required  
**Response `200`:** `{ "ok": true }`

---

### 9. Chat

**Prefix:** `/api/v1/chat`  
**Auth:** All endpoints require authentication.

---

#### `POST /rooms`
Create a chat room.

**Request body:**
```json
{
  "name": "Event Planning",
  "room_type": "GROUP",
  "description": "Planning channel for the hackathon",
  "member_ids": ["uuid1", "uuid2"]
}
```

| Field | Values |
|-------|--------|
| `room_type` | `DIRECT`, `GROUP` |
| `member_ids` | max 50 |

**Response `201`:**
```json
{
  "id": "uuid",
  "name": "Event Planning",
  "room_type": "GROUP",
  "description": "...",
  "event_id": null,
  "community_id": null,
  "member_count": 3,
  "is_active": true,
  "created_at": "..."
}
```

---

#### `GET /rooms`
List all rooms the authenticated user belongs to (newest first).

**Response `200`:** Array of room objects.

---

#### `GET /rooms/{room_id}/messages`
Paginated message history (must be a room member).

**Query params:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `cursor` | string | null | ISO datetime of the oldest message on the last page |
| `limit` | int | 50 | 1–100 |

**Response `200`:**
```json
{
  "messages": [
    {
      "id": "uuid",
      "room_id": "uuid",
      "sender_id": "uuid",
      "sender_name": "Alice",
      "sender_avatar": "...",
      "message_type": "TEXT",
      "content": "See you at the venue!",
      "media_data": null,
      "reply_to_id": null,
      "reactions": { "👍": ["user-uuid-1"] },
      "is_deleted": false,
      "created_at": "..."
    }
  ],
  "next_cursor": "2026-05-01T09:00:00",
  "has_more": false
}
```

---

#### `POST /rooms/{room_id}/members/{user_id}`
Add a user to a room (room admin only).

**Response `200`:** `{ "ok": true }`

---

### 10. Notifications

**Prefix:** `/api/v1/notifications`  
**Auth:** All endpoints require authentication.

---

#### `GET /`
List notifications for the authenticated user.

**Query params:** `cursor`, `limit` (1–50, default 20)

**Response `200`:**
```json
{
  "notifications": [
    {
      "id": "uuid",
      "notification_type": "NEW_FOLLOWER",
      "title": "Alice started following you",
      "body": "...",
      "data": {},
      "actor_id": "uuid",
      "actor_name": "Alice",
      "actor_avatar": "...",
      "is_read": false,
      "created_at": "..."
    }
  ],
  "unread_count": 3,
  "next_cursor": null,
  "has_more": false
}
```

---

#### `POST /read`
Mark notifications as read.

**Request body:**
```json
{ "notification_ids": ["uuid1", "uuid2"] }
```

Pass `null` for `notification_ids` to mark **all** notifications as read.

**Response `200`:** `{ "marked_read": 3 }`

---

### 11. Gamification

**Prefix:** `/api/v1/gamification`

---

#### `GET /me`
Get the authenticated user's XP, level, streak, and achievements.

**Auth:** Required

**Response `200`:**
```json
{
  "xp": 1250,
  "level": 5,
  "xp_to_next_level": 250,
  "streak": {
    "current_streak": 7,
    "longest_streak": 14,
    "last_check_in": "2026-05-12"
  },
  "achievements": [
    {
      "id": "uuid",
      "slug": "first_rsvp",
      "name": "First Timer",
      "description": "RSVP to your first event",
      "tier": "BRONZE",
      "icon_url": null,
      "xp_reward": 50,
      "unlocked": true,
      "unlocked_at": "2026-04-10T..."
    }
  ],
  "recent_xp_logs": [
    { "id": "uuid", "action": "DAILY_LOGIN", "points": 3, "ref_id": null, "created_at": "..." }
  ]
}
```

---

#### `POST /checkin`
Daily check-in. Call once per day to maintain streak and earn XP.

**Auth:** Required

**Response `200`:**
```json
{
  "streak": 8,
  "xp_awarded": 3,
  "total_xp": 1253,
  "leveled_up": false,
  "new_achievements": []
}
```

---

#### `GET /leaderboard`
Top users by XP.

**Auth:** Open  
**Query params:** `limit` (5–100, default 50)

**Response `200`:**
```json
[
  { "rank": 1, "user_id": "uuid", "name": "Bob", "avatar_url": "...", "xp": 4500, "level": 12 }
]
```

---

### 12. Uploads

**Prefix:** `/api/v1/uploads`  
**Auth:** Required  
**Rate limit:** 10 req / 60 s per user

---

#### `POST /`
Upload a file to Cloudinary.

**Content-Type:** `multipart/form-data`

**Form fields:**

| Field | Type | Description |
|-------|------|-------------|
| `file` | file | The file to upload |
| `folder` | string | Destination folder (e.g. `ilaka/banners`) |

> **Note:** Folder `ilaka/payment-qr` requires ORGANIZER or ADMIN role.

**Response `200`:**
```json
{ "url": "https://res.cloudinary.com/your-cloud/image/upload/..." }
```

**Typical usage flow:**
1. Upload banner → get URL
2. Use URL in `POST /events` as `banner_url`

---

### 13. AI Search

**Prefix:** `/api/v1/ai`

---

#### `POST /search`
Semantic event search powered by OpenAI embeddings + Pinecone vector similarity.

**Auth:** Optional  
**Rate limit:** 30 req / 60 s per user / IP

**Request body:**
```json
{
  "query": "outdoor yoga classes this weekend",
  "latitude": 12.9716,
  "longitude": 77.5946,
  "radius": 15000
}
```

**Response `200`:**
```json
{
  "events": [ /* EventResponse objects ranked by semantic relevance + engagement */ ]
}
```

Results are always constrained to the given radius — the AI cannot return events outside it.

---

### 14. Admin

**Prefix:** `/api/v1/admin`  
**Auth:** ADMIN role required for all endpoints.

---

#### `GET /events`
Paginated list of all events.

**Query params:** `page` (0-indexed, default 0, 50 per page)

**Response `200`:**
```json
{
  "events": [
    { "id": "uuid", "title": "...", "visibility": "PUBLIC", "organizer_id": "uuid", "start_time": "...", "end_time": "...", "engagement_score": 45.0, "capacity": 100, "created_at": "..." }
  ],
  "total": 250,
  "page": 0,
  "page_size": 50
}
```

---

#### `DELETE /events/{event_id}`
Force-delete any event.

**Response `200`:** `{ "ok": true }`

---

#### `GET /users`
Paginated list of all users.

**Query params:** `page` (0-indexed, default 0)

**Response `200`:**
```json
{
  "users": [
    { "id": "uuid", "name": "Alice", "email": "alice@example.com", "role": "USER", "created_at": "..." }
  ],
  "total": 1000,
  "page": 0,
  "page_size": 50
}
```

---

#### `PATCH /users/{user_id}`
Change a user's role.

**Request body:**
```json
{ "role": "ORGANIZER" }
```

`role` values: `USER`, `ORGANIZER`, `ADMIN`

**Response `200`:** `{ "user": { "id": "...", "email": "...", "role": "ORGANIZER" } }`

---

#### `DELETE /users/{user_id}`
Delete a user account.

**Response `200`:** `{ "ok": true }`

---

### 15. Companies

**Prefix:** `/api/v1/companies`  
**Auth:** ADMIN role required for all endpoints.

---

#### `POST /`
Onboard a new B2B company. Creates a service user and generates the first API key.

**Request body:**
```json
{
  "name": "Acme Corp",
  "contact_email": "api@acme.com",
  "plan": "PAID"
}
```

`plan` values: `FREE`, `PAID`, `ENTERPRISE`

**Response `201`:**
```json
{
  "company": {
    "id": "uuid",
    "name": "Acme Corp",
    "slug": "acme-corp",
    "contact_email": "api@acme.com",
    "plan": "PAID",
    "is_active": true,
    "created_at": "..."
  },
  "api_key": "ik_abc123..."
}
```

> **Save `api_key` immediately — it is shown only once.**

---

#### `GET /`
List all companies.

**Response `200`:** Array of company objects (without `api_key`).

---

#### `PATCH /{company_id}/deactivate`
Deactivate a company. All its API keys stop working immediately.

**Response `200`:** Updated company object with `is_active: false`.

---

### 16. API Keys

**Prefix:** `/api/v1/keys`  
**Auth:** Admin or the company's own service user.

---

#### `GET /`
List API keys for a company.

**Query params:** `company_id` (required)

**Response `200`:**
```json
[
  {
    "id": "uuid",
    "company_id": "uuid",
    "name": "Production Key",
    "prefix": "ik_1afc...",
    "last_used_at": "2026-05-12T...",
    "created_at": "..."
  }
]
```

Full key values are never returned after creation.

---

#### `POST /`
Create an API key for a company (max 10 per company).

**Request body:**
```json
{
  "name": "Production Key",
  "company_id": "uuid"
}
```

**Response `201`:**
```json
{
  "id": "uuid",
  "company_id": "uuid",
  "name": "Production Key",
  "prefix": "ik_1afc...",
  "last_used_at": null,
  "created_at": "...",
  "key": "ik_1afcfc2cdde0da52ecd2e58d..."
}
```

> **Save `key` immediately — it is shown only once.** The raw key is never stored; only its SHA-256 hash is kept.

---

#### `DELETE /{key_id}`
Revoke an API key.

**Response `204`:** No content. The key stops working immediately.

---

### 17. Geo

**Prefix:** `/api/v1/geo`

---

#### `GET /ip`
Resolve the caller's IP address to coordinates.

**Auth:** Open  
**Rate limit:** 10 req / 60 s per IP

**Response `200`:**
```json
{
  "latitude": 12.9716,
  "longitude": 77.5946,
  "city": "Bengaluru",
  "region": "Karnataka"
}
```

Use this on app load to initialise location before the user explicitly shares GPS coordinates.

---

### 18. Health

**Prefix:** `/api/v1/health`

---

#### `GET /`
Service liveness check.

**Auth:**  
- Development: open  
- Production: `Authorization: Bearer <HEALTH_SECRET>`

**Response `200`:**
```json
{ "ok": true, "db": "connected" }
```

**Response `503`:**
```json
{ "ok": false, "db": "unreachable", "detail": "..." }
```

---

### 19. Cron

**Prefix:** `/api/v1/cron`  
**Auth:** `Authorization: Bearer <CRON_SECRET>`  
These endpoints are called by an external scheduler (e.g. GitHub Actions cron, AWS EventBridge), not by users.

---

#### `GET /reminders`
Send event reminder notifications to RSVPed users.

**Response `200`:** `{ "ok": true, "results": { ... } }`

---

#### `GET /cleanup-events`
Archive or delete expired events.

**Response `200`:** Job result summary.

---

### 20. WebSocket

**Path:** `/ws` (not under `/api/v1`)

**Connection:**
```
ws://host/ws?token=<access_token>
```

The token is validated on connect. The connection closes with code `4001` if the token is missing or invalid.

---

#### Sending messages

All messages sent to the server follow this structure:

```json
{
  "action": "send_message",
  "room_id": "uuid",
  "data": {
    "content": "Hey!",
    "message_type": "TEXT",
    "reply_to_id": null
  }
}
```

**Available `action` values:**

| Action | Description | Required `data` fields |
|--------|-------------|------------------------|
| `send_message` | Send a chat message | `content`, `message_type`, `reply_to_id` |
| `typing` | Broadcast typing indicator | `room_id` (in top-level) |
| `read` | Mark messages as read | `room_id` |
| `react` | React to a message | `message_id`, `emoji` |
| `ping` | Keepalive | none |

---

#### Receiving events

The server pushes events in this format:

```json
{
  "event": "message",
  "data": { ... }
}
```

**Event types you will receive:**

| Event | Triggered by |
|-------|-------------|
| `message` | New chat message in a room you're in |
| `typing` | Another user typing in a room |
| `read_receipt` | Another user read messages |
| `user_joined` | New member added to a room |
| `notification` | System notification (follow, RSVP, etc.) |
| `pong` | Response to your `ping` |

---

## Common Field Types

| Type | Format | Example |
|------|--------|---------|
| ID | UUID string | `"9367743f-0b16-4acd-8876-5fe07310579f"` |
| Datetime | ISO 8601 UTC | `"2026-06-01T18:00:00"` |
| Latitude | float | `12.9716` (range −90 to 90) |
| Longitude | float | `77.5946` (range −180 to 180) |
| Radius | float (metres) | `10000` |
| Enum | string value | `"PUBLIC"`, `"ORGANIZER"` |

---

## Gamification Reference

### XP Actions

| Action | XP Awarded |
|--------|-----------|
| `DAILY_LOGIN` | 3 |
| `CREATE_POST` | 5 |
| `RECEIVE_LIKE` | 1 |
| `RECEIVE_COMMENT` | 2 |
| `FOLLOW_USER` | 2 |
| `GAIN_FOLLOWER` | 2 |
| `JOIN_COMMUNITY` | 5 |
| `POST_IN_COMMUNITY` | 4 |

### Achievement Tiers

| Tier | Description |
|------|-------------|
| `BRONZE` | Entry-level milestones |
| `SILVER` | Mid-level milestones |
| `GOLD` | Advanced milestones |
| `PLATINUM` | Elite milestones |

### Example Achievements

| Slug | Name | Condition | Tier | XP |
|------|------|-----------|------|----|
| `first_rsvp` | First Timer | RSVP to first event | BRONZE | 50 |
| `first_host` | Curator | Host first event | BRONZE | 75 |
| `builder_10` | Builder | Host 10 events | GOLD | 300 |
| `social_butterfly` | Social Butterfly | Gain 10 followers | BRONZE | 50 |
| `influencer_100` | Influencer | Gain 100 followers | SILVER | 200 |
| `streak_7` | Week Warrior | 7-day login streak | BRONZE | 70 |
| `streak_30` | Committed | 30-day login streak | SILVER | 300 |
