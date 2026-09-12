import os
from database.core import SessionLocal
from models.user import User
from models.connection import DatabaseConnection
from security.auth import get_password_hash
import database.demo_db

def seed():
    # 1. Create demo database file
    database.demo_db.create_demo_database("demo.db")
    
    db = SessionLocal()
    try:
        # 2. Create default user
        user = db.query(User).filter(User.email == "admin@demo.com").first()
        if not user:
            user = User(
                name="Alex",
                email="admin@demo.com",
                hashed_password=get_password_hash("password123"),
                role="ADMIN"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print("Created default user: admin@demo.com / password123")
        
        # 3. Create default connection
        conn = db.query(DatabaseConnection).filter(DatabaseConnection.name == "Demo Database").first()
        if not conn:
            # We assume demo.db is in the backend root
            conn = DatabaseConnection(
                name="Demo Database",
                db_type="sqlite",
                database_name="demo.db",
                user_id=user.id
            )
            db.add(conn)
            db.commit()
            print("Created Demo Database connection")
            
    finally:
        db.close()

if __name__ == "__main__":
    seed()
