# API Documentation

## Overview
This document outlines the API endpoints and their usage for the Ivan Prints Business Management System. The API is built using Next.js API routes and integrates with Supabase for data management.

## Authentication

### Login
```typescript
POST /api/auth/login
Content-Type: application/json

{
  "email": "string",
  "pin": "string"  // 4-digit PIN
}

Response:
{
  "user": {
    "id": "uuid",
    "email": "string",
    "full_name": "string",
    "role": "admin" | "manager" | "employee"
  },
  "session": {
    "access_token": "string",
    "refresh_token": "string"
  }
}
```

### Verify Device
```typescript
POST /api/auth/verify-device
Content-Type: application/json
Authorization: Bearer <token>

{
  "verification_code": "string"  // 6-digit code
}

Response:
{
  "success": true,
  "device_id": "string"
}
```

### Refresh Token
```typescript
POST /api/auth/refresh
Content-Type: application/json

{
  "refresh_token": "string"
}

Response:
{
  "access_token": "string",
  "refresh_token": "string"
}
```

## Users

### List Users
```typescript
GET /api/users
Authorization: Bearer <token>
Query Parameters:
- role?: "admin" | "manager" | "employee"
- status?: "active" | "inactive"
- page?: number
- limit?: number

Response:
{
  "users": [
    {
      "id": "uuid",
      "email": "string",
      "full_name": "string",
      "role": "string",
      "status": "string",
      "created_at": "string"
    }
  ],
  "total": number,
  "page": number,
  "limit": number
}
```

### Create User
```typescript
POST /api/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "string",
  "full_name": "string",
  "role": "admin" | "manager" | "employee",
  "pin": "string"  // 4-digit PIN
}

Response:
{
  "id": "uuid",
  "email": "string",
  "full_name": "string",
  "role": "string",
  "status": "active"
}
```

## Orders

### List Orders
```typescript
GET /api/orders
Authorization: Bearer <token>
Query Parameters:
- status?: "pending" | "in_progress" | "completed" | "delivered" | "cancelled"
- payment_status?: "unpaid" | "partially_paid" | "paid"
- client_id?: string
- start_date?: string
- end_date?: string
- page?: number
- limit?: number

Response:
{
  "orders": [
    {
      "id": "uuid",
      "client": {
        "id": "uuid",
        "name": "string"
      },
      "status": "string",
      "payment_status": "string",
      "total_amount": number,
      "amount_paid": number,
      "created_at": "string",
      "created_by": {
        "id": "uuid",
        "full_name": "string"
      }
    }
  ],
  "total": number,
  "page": number,
  "limit": number
}
```

### Create Order
```typescript
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "client_id": "uuid",
  "items": [
    {
      "item_id": "uuid",
      "quantity": number,
      "unit_price": number,
      "profit_amount": number,
      "labor_amount": number
    }
  ],
  "notes": string[]
}

Response:
{
  "id": "uuid",
  "client": {
    "id": "uuid",
    "name": "string"
  },
  "items": [
    {
      "id": "uuid",
      "item": {
        "id": "uuid",
        "name": "string"
      },
      "quantity": number,
      "unit_price": number,
      "profit_amount": number,
      "labor_amount": number
    }
  ],
  "total_amount": number,
  "status": "pending",
  "payment_status": "unpaid",
  "created_at": "string"
}
```

### Update Order Status
```typescript
PATCH /api/orders/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "pending" | "in_progress" | "completed" | "delivered" | "cancelled"
}

Response:
{
  "id": "uuid",
  "status": "string",
  "updated_at": "string"
}
```

### Record Payment
```typescript
POST /api/orders/:id/payments
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": number,
  "notes": string[]
}

Response:
{
  "id": "uuid",
  "amount_paid": number,
  "payment_status": "string",
  "updated_at": "string"
}
```

## Tasks

### List Tasks
```typescript
GET /api/tasks
Authorization: Bearer <token>
Query Parameters:
- status?: "pending" | "completed"
- priority?: "low" | "medium" | "high"
- assigned_to?: string
- due_date_start?: string
- due_date_end?: string
- page?: number
- limit?: number

Response:
{
  "tasks": [
    {
      "id": "uuid",
      "title": "string",
      "description": "string",
      "status": "string",
      "priority": "string",
      "due_date": "string",
      "assigned_to": {
        "id": "uuid",
        "full_name": "string"
      },
      "created_by": {
        "id": "uuid",
        "full_name": "string"
      },
      "created_at": "string"
    }
  ],
  "total": number,
  "page": number,
  "limit": number
}
```

### Create Task
```typescript
POST /api/tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "string",
  "description": "string",
  "priority": "low" | "medium" | "high",
  "assigned_to": "uuid",
  "due_date": "string",
  "related_to": {
    "type": "order" | "expense" | "purchase",
    "id": "uuid"
  },
  "is_recurring": boolean,
  "recurrence_rule": {
    "frequency": "daily" | "weekly" | "monthly",
    "end_date": "string"
  }
}

Response:
{
  "id": "uuid",
  "title": "string",
  "description": "string",
  "status": "pending",
  "priority": "string",
  "due_date": "string",
  "assigned_to": {
    "id": "uuid",
    "full_name": "string"
  },
  "created_at": "string"
}
```

## Expenses

### List Expenses
```typescript
GET /api/expenses
Authorization: Bearer <token>
Query Parameters:
- category?: string
- start_date?: string
- end_date?: string
- page?: number
- limit?: number

Response:
{
  "expenses": [
    {
      "id": "uuid",
      "category": "string",
      "description": "string",
      "amount": number,
      "date": "string",
      "created_by": {
        "id": "uuid",
        "full_name": "string"
      },
      "created_at": "string"
    }
  ],
  "total": number,
  "page": number,
  "limit": number
}
```

### Create Expense
```typescript
POST /api/expenses
Authorization: Bearer <token>
Content-Type: application/json

{
  "category": "string",
  "description": "string",
  "amount": number,
  "date": "string",
  "notes": string[]
}

Response:
{
  "id": "uuid",
  "category": "string",
  "description": "string",
  "amount": number,
  "date": "string",
  "created_at": "string"
}
```

## Material Purchases

### List Purchases
```typescript
GET /api/material-purchases
Authorization: Bearer <token>
Query Parameters:
- supplier_id?: string
- start_date?: string
- end_date?: string
- page?: number
- limit?: number

Response:
{
  "purchases": [
    {
      "id": "uuid",
      "supplier": {
        "id": "uuid",
        "name": "string"
      },
      "material": "string",
      "quantity": number,
      "cost": number,
      "date": "string",
      "created_by": {
        "id": "uuid",
        "full_name": "string"
      },
      "created_at": "string"
    }
  ],
  "total": number,
  "page": number,
  "limit": number
}
```

### Create Purchase
```typescript
POST /api/material-purchases
Authorization: Bearer <token>
Content-Type: application/json

{
  "supplier_id": "uuid",
  "material": "string",
  "quantity": number,
  "cost": number,
  "date": "string",
  "notes": string[]
}

Response:
{
  "id": "uuid",
  "supplier": {
    "id": "uuid",
    "name": "string"
  },
  "material": "string",
  "quantity": number,
  "cost": number,
  "date": "string",
  "created_at": "string"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "string",
    "details": {
      "field": ["error message"]
    }
  }
}
```

### 401 Unauthorized
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

### 403 Forbidden
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions"
  }
}
```

### 404 Not Found
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found"
  }
}
```

### 500 Internal Server Error
```json
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

## Rate Limiting
- Rate limit: 100 requests per minute per IP
- Rate limit headers:
  - X-RateLimit-Limit: Maximum requests per minute
  - X-RateLimit-Remaining: Remaining requests in the current window
  - X-RateLimit-Reset: Time when the rate limit resets (Unix timestamp)

## Pagination
All list endpoints support pagination with the following query parameters:
- page: Page number (default: 1)
- limit: Items per page (default: 20, max: 100)

Response includes:
- total: Total number of items
- page: Current page number
- limit: Current page size

## Security
1. All endpoints require authentication except login
2. JWT tokens used for authentication
3. CORS enabled for frontend domain only
4. Rate limiting to prevent abuse
5. Input validation on all endpoints
6. Sensitive data encryption in transit and at rest

## Resources
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction) 