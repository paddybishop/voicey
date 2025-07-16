# Voice Todo App - API Specification

## Overview
RESTful API design for the Voice Todo App with WebSocket support for real-time features. Built with enterprise-grade security, scalability, and performance in mind.

## Base URL
- Production: `https://api.voicetodo.com/v1`
- Development: `https://dev-api.voicetodo.com/v1`

## Authentication
- JWT tokens for authentication
- Refresh token rotation for security
- Rate limiting per endpoint
- API key authentication for third-party integrations

## Headers
```
Content-Type: application/json
Authorization: Bearer {jwt_token}
X-API-Version: 1.0
X-Request-ID: {unique_request_id}
```

## Standard Response Format
```json
{
  "success": true,
  "data": {},
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "request_id": "req_123456",
    "version": "1.0"
  },
  "errors": []
}
```

## Error Response Format
```json
{
  "success": false,
  "data": null,
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "request_id": "req_123456",
    "version": "1.0"
  },
  "errors": [
    {
      "code": "VALIDATION_ERROR",
      "message": "Invalid input data",
      "field": "email",
      "details": "Email format is invalid"
    }
  ]
}
```

---

## 1. AUTHENTICATION & USER MANAGEMENT

### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "first_name": "John",
  "last_name": "Doe",
  "timezone": "America/New_York",
  "locale": "en-US"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "is_verified": false,
      "created_at": "2024-01-15T10:30:00Z"
    },
    "tokens": {
      "access_token": "jwt_token",
      "refresh_token": "refresh_token",
      "expires_in": 3600
    }
  }
}
```

### POST /auth/login
Authenticate user and return JWT tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "device_info": {
    "device_type": "mobile",
    "device_name": "iPhone 15 Pro",
    "os": "iOS 17.0",
    "app_version": "1.0.0"
  }
}
```

### POST /auth/refresh
Refresh access token using refresh token.

### POST /auth/logout
Invalidate current session tokens.

### POST /auth/forgot-password
Send password reset email.

### POST /auth/reset-password
Reset password with token from email.

### POST /auth/verify-email
Verify email address with token.

---

## 2. USER PROFILE & PREFERENCES

### GET /users/profile
Get current user profile information.

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "johndoe",
      "first_name": "John",
      "last_name": "Doe",
      "avatar_url": "https://cdn.voicetodo.com/avatars/uuid.jpg",
      "timezone": "America/New_York",
      "locale": "en-US",
      "is_premium": false,
      "created_at": "2024-01-15T10:30:00Z"
    }
  }
}
```

### PUT /users/profile
Update user profile information.

### GET /users/preferences
Get user preferences and AI personality settings.

**Response:**
```json
{
  "success": true,
  "data": {
    "preferences": {
      "voice_enabled": true,
      "voice_language": "en-US",
      "voice_speed": 1.0,
      "voice_pitch": 1.0,
      "preferred_voice": "Samantha",
      "ai_personality": "helpful",
      "ai_response_style": "concise",
      "ai_name": "Assistant",
      "theme": "dark",
      "default_priority": "medium",
      "auto_complete_suggestions": true,
      "show_completed_tasks": true,
      "email_notifications": true,
      "push_notifications": true,
      "reminder_notifications": true
    }
  }
}
```

### PUT /users/preferences
Update user preferences.

### DELETE /users/account
Delete user account (GDPR compliance).

---

## 3. TODOS MANAGEMENT

### GET /todos
Get user's todos with filtering and pagination.

**Query Parameters:**
- `status`: pending, in_progress, completed, cancelled
- `priority`: low, medium, high, urgent
- `category_id`: UUID
- `due_date_from`: ISO 8601 date
- `due_date_to`: ISO 8601 date
- `search`: Text search
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `sort`: created_at, updated_at, due_date, priority
- `order`: asc, desc

**Response:**
```json
{
  "success": true,
  "data": {
    "todos": [
      {
        "id": "uuid",
        "title": "Buy groceries",
        "description": "Milk, bread, eggs",
        "priority": "medium",
        "status": "pending",
        "category": {
          "id": "uuid",
          "name": "Shopping",
          "color": "#F59E0B"
        },
        "due_date": "2024-01-16T18:00:00Z",
        "reminder_at": "2024-01-16T17:00:00Z",
        "tags": ["urgent", "weekend"],
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-15T10:30:00Z",
        "created_via": "voice",
        "voice_confidence": 0.95,
        "subtasks": [
          {
            "id": "uuid",
            "title": "Get milk",
            "completed": false,
            "sort_order": 1
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "total_pages": 3,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

### POST /todos
Create a new todo.

**Request Body:**
```json
{
  "title": "Buy groceries",
  "description": "Milk, bread, eggs",
  "priority": "medium",
  "category_id": "uuid",
  "due_date": "2024-01-16T18:00:00Z",
  "reminder_at": "2024-01-16T17:00:00Z",
  "tags": ["urgent", "weekend"],
  "subtasks": [
    {
      "title": "Get milk",
      "sort_order": 1
    }
  ],
  "created_via": "voice",
  "voice_confidence": 0.95,
  "original_voice_text": "Add buy groceries to my shopping list"
}
```

### GET /todos/{id}
Get a specific todo by ID.

### PUT /todos/{id}
Update a specific todo.

### DELETE /todos/{id}
Delete a specific todo (soft delete).

### POST /todos/{id}/complete
Mark a todo as completed.

### POST /todos/{id}/subtasks
Add a subtask to a todo.

### PUT /todos/{id}/subtasks/{subtask_id}
Update a subtask.

### DELETE /todos/{id}/subtasks/{subtask_id}
Delete a subtask.

---

## 4. VOICE COMMANDS

### POST /voice/process
Process a voice command and return the action to take.

**Request Body:**
```json
{
  "transcript": "Add buy groceries to my shopping list",
  "confidence": 0.95,
  "language": "en-US",
  "audio_duration_ms": 2500,
  "context": {
    "current_todos_count": 15,
    "last_category_used": "Shopping"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "command": {
      "type": "add_todo",
      "confidence": 0.95,
      "processed_successfully": true,
      "todo": {
        "id": "uuid",
        "title": "Buy groceries",
        "category_id": "uuid",
        "priority": "medium"
      },
      "response_text": "Added 'Buy groceries' to your Shopping list",
      "processing_time_ms": 150
    }
  }
}
```

### GET /voice/commands
Get voice command history.

### GET /voice/stats
Get voice interaction statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "total_commands": 1250,
      "successful_commands": 1180,
      "success_rate": 0.94,
      "average_confidence": 0.92,
      "most_used_commands": [
        {
          "command": "add_todo",
          "count": 450,
          "success_rate": 0.96
        }
      ],
      "daily_usage": [
        {
          "date": "2024-01-15",
          "commands": 25,
          "success_rate": 0.96
        }
      ]
    }
  }
}
```

---

## 5. CATEGORIES

### GET /categories
Get user's categories.

**Response:**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "uuid",
        "name": "Shopping",
        "color": "#F59E0B",
        "icon": "shopping-cart",
        "is_system": false,
        "sort_order": 1,
        "todo_count": 5,
        "created_at": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

### POST /categories
Create a new category.

### PUT /categories/{id}
Update a category.

### DELETE /categories/{id}
Delete a category.

---

## 6. REAL-TIME FEATURES (WebSocket)

### WebSocket Connection
Connect to: `wss://api.voicetodo.com/v1/ws`

**Authentication:**
Send JWT token in connection headers or as first message.

**Message Format:**
```json
{
  "type": "message_type",
  "data": {},
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Supported Message Types:

#### todo_created
```json
{
  "type": "todo_created",
  "data": {
    "todo": { /* todo object */ }
  }
}
```

#### todo_updated
```json
{
  "type": "todo_updated",
  "data": {
    "todo": { /* updated todo object */ }
  }
}
```

#### todo_completed
```json
{
  "type": "todo_completed",
  "data": {
    "todo_id": "uuid",
    "completed_at": "2024-01-15T10:30:00Z"
  }
}
```

#### voice_command_processed
```json
{
  "type": "voice_command_processed",
  "data": {
    "command": { /* voice command result */ }
  }
}
```

---

## 7. TEAM COLLABORATION

### GET /teams
Get user's teams.

### POST /teams
Create a new team.

### GET /teams/{id}
Get team details.

### PUT /teams/{id}
Update team settings.

### DELETE /teams/{id}
Delete a team.

### POST /teams/{id}/members
Add team member.

### DELETE /teams/{id}/members/{user_id}
Remove team member.

### GET /teams/{id}/shared-lists
Get shared todo lists.

### POST /teams/{id}/shared-lists
Create shared todo list.

---

## 8. INTEGRATIONS

### GET /integrations
Get user's connected integrations.

### POST /integrations/{service}
Connect to external service (Google Calendar, Slack, etc.).

### DELETE /integrations/{service}
Disconnect from external service.

### POST /integrations/{service}/sync
Trigger manual sync with external service.

---

## 9. NOTIFICATIONS

### GET /notifications
Get user's notifications.

### PUT /notifications/{id}/read
Mark notification as read.

### DELETE /notifications/{id}
Delete notification.

### POST /notifications/settings
Update notification preferences.

---

## 10. ANALYTICS & REPORTING

### GET /analytics/dashboard
Get user dashboard analytics.

**Response:**
```json
{
  "success": true,
  "data": {
    "analytics": {
      "total_todos": 250,
      "completed_todos": 180,
      "pending_todos": 70,
      "completion_rate": 0.72,
      "productivity_score": 85,
      "weekly_trend": [
        {
          "date": "2024-01-08",
          "created": 12,
          "completed": 8
        }
      ],
      "category_distribution": [
        {
          "category": "Work",
          "count": 45,
          "percentage": 0.18
        }
      ],
      "voice_usage": {
        "total_commands": 450,
        "success_rate": 0.94,
        "most_used_command": "add_todo"
      }
    }
  }
}
```

### GET /analytics/export
Export user data (GDPR compliance).

---

## 11. ADMIN ENDPOINTS

### GET /admin/users
Get all users (admin only).

### GET /admin/analytics
Get system-wide analytics.

### POST /admin/users/{id}/suspend
Suspend user account.

### GET /admin/health
System health check.

---

## Rate Limiting
- Authentication endpoints: 5 requests/minute
- Todo operations: 100 requests/minute
- Voice processing: 50 requests/minute
- Analytics: 20 requests/minute

## Error Codes
- `VALIDATION_ERROR`: Invalid input data
- `AUTHENTICATION_ERROR`: Invalid credentials
- `AUTHORIZATION_ERROR`: Insufficient permissions
- `RESOURCE_NOT_FOUND`: Resource doesn't exist
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `VOICE_PROCESSING_ERROR`: Voice command processing failed
- `INTEGRATION_ERROR`: External service integration failed
- `SYSTEM_ERROR`: Internal server error

## WebSocket Events
- Connection established
- Authentication success/failure
- Real-time todo updates
- Voice command processing
- System notifications
- Connection lost/reconnected

## API Versioning
- Header-based versioning: `X-API-Version: 1.0`
- URL-based versioning: `/v1/`, `/v2/`
- Backward compatibility maintained for 12 months

## Security Features
- JWT token authentication
- Rate limiting
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF protection
- HTTPS only
- API key authentication for integrations
- Audit logging