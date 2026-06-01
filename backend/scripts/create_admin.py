"""
Create admin user.
Usage: cd backend && python scripts/create_admin.py
"""
import sys, os
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
os.chdir(Path(__file__).parent.parent)

from app.core.config import settings
from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.user import Profile, User


def create_admin():
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == settings.admin_email).first()
        if existing:
            print(f"Admin already exists: {settings.admin_email}")
            return

        password = input("Enter admin password: ").strip()
        if not password:
            print("Password cannot be empty")
            return

        admin = User(
            name="Admin",
            email=settings.admin_email,
            hashed_password=hash_password(password),
            is_admin=True,
        )
        db.add(admin)
        db.flush()
        db.add(Profile(user_id=admin.id, exam_type="CSS"))
        db.commit()
        print(f"Admin created: {settings.admin_email}")
    finally:
        db.close()


if __name__ == "__main__":
    create_admin()
