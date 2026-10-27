import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine, SessionLocal
from app.seed import seed_database

@pytest.fixture(scope="session")
def client():
    # Initialize schema and baseline seeds
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_database(db)
    db.close()

    with TestClient(app) as test_client:
        yield test_client
