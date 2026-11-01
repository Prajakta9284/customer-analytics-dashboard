import sys
from pathlib import Path

import pytest

# Add the backend folder to Python's import path
BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from app import app as flask_app


@pytest.fixture
def client():
    flask_app.config.update(
        TESTING=True,
        SQLALCHEMY_DATABASE_URI="sqlite://",
        JWT_SECRET_KEY="test-secret-key-for-automated-testing-123456",
    )

    from extensions import db
    import models

    with flask_app.app_context():
        db.create_all()

        with flask_app.test_client() as test_client:
            yield test_client

        db.session.remove()
        db.drop_all()