# API Documentation

## Base URL
The base URL for accessing the Business Management API is:
```
https://api.businessmanagement.com/v1
```

## Authentication Endpoints
### 1. **Login**
- **Endpoint:** `/auth/login`
- **Method:** `POST`
- **Request Body:**  
  ```json
  {
    "username": "<your_username>",
    "password": "<your_password>"
  }
  ```
- **Response Example:**  
  ```json
  {
    "token": "<your_jwt_token>",
    "expires_in": 3600,
    "user": {
      "id": "<user_id>",
      "username": "<your_username>"
    }
  }
  ```

### 2. **Logout**
- **Endpoint:** `/auth/logout`
- **Method:** `POST`
- **Headers:**  
  ```
  {
    "Authorization": "Bearer <your_jwt_token>"
  }
  ```

## Dashboard Endpoints
### 1. **Get Dashboard Data**
- **Endpoint:** `/dashboard/data`
- **Method:** `GET`
- **Headers:**  
  ```
  {
    "Authorization": "Bearer <your_jwt_token>"
  }
  ```
- **Response Example:**  
  ```json
  {
    "total_orders": 150,
    "total_revenue": 5000.00,
    "total_customers": 200
  }
  ```

## Inventory Endpoints
### 1. **Get Inventory List**
- **Endpoint:** `/inventory`
- **Method:** `GET`
- **Headers:**  
  ```
  {
    "Authorization": "Bearer <your_jwt_token>"
  }
  ```
- **Response Example:**  
  ```json
  [
    {
      "id": "1",
      "name": "Product A",
      "quantity": 100,
      "price": 20.00
    },
    {
      "id": "2",
      "name": "Product B",
      "quantity": 150,
      "price": 30.00
    }
  ]
  ```

## Orders Endpoints
### 1. **Create Order**
- **Endpoint:** `/orders`
- **Method:** `POST`
- **Request Body:**  
  ```json
  {
    "customer_id": "<customer_id>",
    "items": [
      {
        "product_id": "<product_id>",
        "quantity": 2
      }
    ]
  }
  ```
- **Response Example:**  
  ```json
  {
    "order_id": "<order_id>",
    "status": "created"
  }
  ```

### 2. **Get Order Details**
- **Endpoint:** `/orders/{order_id}`
- **Method:** `GET`
- **Headers:**  
  ```
  {
    "Authorization": "Bearer <your_jwt_token>"
  }
  ```
- **Response Example:**  
  ```json
  {
    "order_id": "<order_id>",
    "status": "completed",
    "items": [
      {
        "product_id": "<product_id>",
        "quantity": 2,
        "price": 20.00
      }
    ]
  }
  ```