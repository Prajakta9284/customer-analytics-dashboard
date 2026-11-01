def test_home_route(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json["status"] == "running"


def test_health_route(client):
    response = client.get("/health/live")
    assert response.status_code == 200


def test_register_user(client):
    response = client.post(
        "/api/auth/register",
        json={
            "name": "Test User",
            "email": "testuser@example.com",
            "password": "Test@12345"
        }
    )

    assert response.status_code in [200, 201]


def test_login_user(client):
    client.post(
        "/api/auth/register",
        json={
            "name": "Test User",
            "email": "testuser@example.com",
            "password": "Test@12345"
        }
    )

    response = client.post(
        "/api/auth/login",
        json={
            "email": "testuser@example.com",
            "password": "Test@12345"
        }
    )

    assert response.status_code == 200
    assert "access_token" in response.json
    
def get_auth_headers(client):
    client.post(
        "/api/auth/register",
        json={
            "name": "Customer Tester",
            "email": "crudtest@example.com",
            "password": "Test@12345"
        }
    )

    response = client.post(
        "/api/auth/login",
        json={
            "email": "crudtest@example.com",
            "password": "Test@12345"
        }
    )

    token = response.json["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_create_customer(client):
    headers = get_auth_headers(client)

    response = client.post(
        "/api/customers",
        headers=headers,
        json={
            "name": "Rahul Sharma",
            "email": "rahul@example.com",
            "phone": "9876543210",
            "company": "ABC Technologies",
            "status": "active"
        }
    )

    assert response.status_code in [200, 201]


def test_get_customers(client):
    headers = get_auth_headers(client)

    response = client.get(
        "/api/customers",
        headers=headers
    )

    assert response.status_code == 200
    
def test_update_customer(client):
    headers = get_auth_headers(client)

    create_response = client.post(
        "/api/customers",
        headers=headers,
        json={
            "name": "Rahul Sharma",
            "email": "rahul@example.com",
            "phone": "9876543210",
            "company": "ABC Technologies",
            "status": "active"
        }
    )

    assert create_response.status_code in [200, 201]
    
    print("CREATE RESPONSE:", create_response.json)

    customer_id = create_response.json["customer"]["id"]

    response = client.put(
        f"/api/customers/{customer_id}",
        headers=headers,
        json={
            "name": "Rahul Updated",
            "email": "rahul@example.com",
            "phone": "9876543210",
            "company": "XYZ Technologies",
            "status": "inactive"
        }
    )

    assert response.status_code == 200


def test_delete_customer(client):
    headers = get_auth_headers(client)

    create_response = client.post(
        "/api/customers",
        headers=headers,
        json={
            "name": "Delete Test",
            "email": "delete@example.com",
            "status": "active"
        }
    )

    assert create_response.status_code in [200, 201]
    
    print("CREATE RESPONSE:", create_response.json)

    customer_id = create_response.json["customer"]["id"]
    
    response = client.delete(
        f"/api/customers/{customer_id}",
        headers=headers
    )

    assert response.status_code == 200
    
def test_customers_require_authentication(client):
    response = client.get("/api/customers")

    assert response.status_code == 401
    
def test_user_cannot_access_another_users_customer(client):
    # Create first user and customer
    headers_user1 = get_auth_headers(client)

    create_response = client.post(
        "/api/customers",
        headers=headers_user1,
        json={
            "name": "Private Customer",
            "email": "private@example.com",
            "status": "active"
        }
    )

    customer_id = create_response.json["customer"]["id"]

    # Register and log in as a second user
    client.post(
        "/api/auth/register",
        json={
            "name": "Second User",
            "email": "second@example.com",
            "password": "Test@12345"
        }
    )

    login_response = client.post(
        "/api/auth/login",
        json={
            "email": "second@example.com",
            "password": "Test@12345"
        }
    )

    token = login_response.json["access_token"]
    headers_user2 = {"Authorization": f"Bearer {token}"}

    # Try accessing the first user's customer
    response = client.get(
        f"/api/customers/{customer_id}",
        headers=headers_user2
    )

    assert response.status_code == 404
    
def test_analytics_summary(client):
    headers = get_auth_headers(client)

    response = client.get(
        "/api/analytics/summary",
        headers=headers
    )

    assert response.status_code == 200
    assert isinstance(response.json, dict)


def test_monthly_growth(client):
    headers = get_auth_headers(client)

    response = client.get(
        "/api/analytics/monthly-growth",
        headers=headers
    )

    assert response.status_code == 200