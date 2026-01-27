"""
SQLAlchemy declarative base for all models.
This file has NO imports from other app modules to avoid circular imports.
"""
from sqlalchemy.orm import declarative_base

Base = declarative_base()
