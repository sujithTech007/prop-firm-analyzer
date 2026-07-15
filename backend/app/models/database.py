import os
from sqlalchemy import create_engine, Column, Integer, String, Float, Text, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker
import datetime

# Ensure data directory exists
data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")
os.makedirs(data_dir, exist_ok=True)

db_path = os.path.join(data_dir, "analyzer.db")
SQLALCHEMY_DATABASE_URL = f"sqlite:///{db_path}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class AnalysisRecord(Base):
    __tablename__ = "analysis_history"

    id = Column(String, primary_key=True, index=True) # UUID
    session_id = Column(String, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    readiness_score = Column(Integer)
    pass_probability = Column(Float)
    verdict = Column(String)
    account_size = Column(Float)
    
    # Store full JSON report for easy retrieval without complex relational mapping
    full_report_json = Column(Text)

# Create all tables
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
