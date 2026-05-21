# Swagger API Documentation Setup

## Overview
All routes have been documented with JSDoc comments so that Swagger can automatically generate API documentation. The Swagger UI is available at `http://localhost:5000/api-docs`.

## Changes Made

### 1. Updated `server.js`
- Added Bearer JWT security scheme to the Swagger configuration
- Routes are configured to scan from `./routes/*.js` for JSDoc comments

### 2. Added Swagger Tags to All Route Files

Each route file now includes a Swagger tag definition at the top for organization:

#### Tag Definitions:
- **Auth** (`auth.routes.js`) - Authentication management
- **Bookings** (`booking.routes.js`) - Booking management
- **Hotels** (`hotel.routes.js`) - Hotel booking and management
- **Parking** (`parking.routes.js`) - Parking area and booking management
- **Taxis** (`taxi.routes.js`) - Taxi booking and management
- **Hourly Passes** (`hourlyPass.routes.js`) - Hourly checkpoint passes management
- **Admin** (`admin.routes.js`) - Admin dashboard and management operations
- **Groups** (`group.routes.js`) - Group management for instructors and members
- **Checkpoints** (`checkpoint.routes.js`) - Checkpoint management
- **Chatbot** (`chatbot.routes.js`) - Multilingual smart chatbot responses
- **AI Detection** (`aiDetection.routes.js`) - AI-based vehicle detection and logging
- **Dashboard** (`dashboard.routes.js`) - Live dashboard data and statistics
- **Crowd** (`crowd.routes.js`) - Real-time crowd data and predictions
- **Location** (`location.routes.js`) - User location tracking and geofencing
- **Passes** (`passes.routes.js`) - Dham pass management and quotas
- **Registration** (`registration.routes.js`) - User registration and profile completion
- **Itinerary** (`itinerary.routes.js`) - Itinerary planning and generation
- **Maps** (`maps.js`) - Offline maps and tile management

### 3. JSDoc Comments for Key Routes

#### Example: Auth Routes
```javascript
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - phone
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               phone:
 *                 type: string
 *                 pattern: '^[0-9]{10}$'
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
```

#### Auth Routes Documented:
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile (requires authentication)
- `PUT /api/auth/profile` - Update user profile (requires authentication)

### 4. Security Scheme
Bearer JWT authentication is configured for all protected routes:
```yaml
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: JWT Bearer token for authentication
```

Protected routes use:
```javascript
security:
  - bearerAuth: []
```

## How to View Documentation

1. Start the backend server:
   ```bash
   npm start
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:5000/api-docs
   ```

3. You'll see the full interactive Swagger UI with:
   - All endpoints organized by tags
   - Request/response schemas
   - Try-it-out functionality
   - Authentication setup

## Adding Documentation to New Routes

When adding new routes, follow this pattern:

```javascript
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: MyFeature
 *     description: Description of this feature
 */

/**
 * @swagger
 * /api/myfeature/endpoint:
 *   get:
 *     summary: Brief description
 *     tags: [MyFeature]
 *     security:
 *       - bearerAuth: []  # Only if requires authentication
 *     parameters:
 *       - in: query
 *         name: param1
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success response
 *       400:
 *         description: Bad request
 */
router.get('/endpoint', authenticate, async (req, res) => {
  // Implementation
});
```

## Next Steps

For a more comprehensive API documentation experience, consider:

1. **Document all endpoints** - Add JSDoc comments to all route handlers
2. **Schema definitions** - Define reusable schemas for request/response bodies
3. **Examples** - Add example requests and responses
4. **Error codes** - Document all possible error responses
5. **Authentication flow** - Add examples for obtaining and using JWT tokens

## References
- [Swagger/OpenAPI Documentation](https://swagger.io/docs/)
- [swagger-jsdoc GitHub](https://github.com/Surnet/swagger-jsdoc)
- [OpenAPI 3.0 Specification](https://spec.openapis.org/oas/v3.0.3)
