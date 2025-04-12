# API Endpoint Guide: Users

Base URL: `https://api.example.com/v1/`

Authentication: Requires API Key in `Authorization: Bearer <YOUR_API_KEY>` header.

## Get User List

*   **Endpoint:** `GET /users`
*   **Description:** Retrieves a list of users. Supports pagination.
*   **Query Parameters:**
    *   `page` (int, optional): Page number (default: 1)
    *   `limit` (int, optional): Results per page (default: 25, max: 100)
*   **Success Response (200 OK):**
    ```json
    {
      "data": [ { "id": 1, "name": "John Doe", "email": "john@example.com" }, ... ],
      "pagination": { "currentPage": 1, "totalPages": 10, "totalItems": 245 }
    }
    ```
*   **Error Responses:** 401 Unauthorized, 400 Bad Request

## Get Single User

*   **Endpoint:** `GET /users/{userId}`
*   **Description:** Retrieves details for a specific user.
*   **Path Parameters:**
    *   `userId` (int, required): The ID of the user to retrieve.
*   **Success Response (200 OK):**
    ```json
    { "id": 1, "name": "John Doe", "email": "john@example.com", "createdAt": "..." }
    ```
*   **Error Responses:** 401 Unauthorized, 404 Not Found

*(Add more endpoints like POST /users, PUT /users/{userId}, DELETE /users/{userId})*