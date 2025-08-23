from datetime import datetime
from main import db


class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(80), unique=True, nullable=False)
    mob=db.Column(db.String(70), unique=True, nullable=True)
    username = db.Column(db.String(120))
    address=db.Column(db.String(280), nullable=False)
    eco_points = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    category = db.Column(db.String(30), default='user')
    password = db.Column(db.String(80), nullable=False)

    claims = db.relationship("ActionClaim", back_populates="user")

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "display_name": self.display_name,
            "eco_points": self.eco_points,
            "created_at": self.created_at.isoformat()
        }

class Report(db.Model):
    __tablename__ = "reports"
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200))
    description = db.Column(db.Text)
    category = db.Column(db.String(80), nullable=False)
    lat = db.Column(db.Float, nullable=False)
    lng = db.Column(db.Float, nullable=False)
    fname = db.Column(db.String(400))
    fpath=db.Column(db.String(700))
    status = db.Column(db.String(20), default="new")  # new, verified, resolved
    reporter_email = db.Column(db.String(120), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    claims = db.relationship("ActionClaim", back_populates="report", cascade="all, delete-orphan")

    def to_dict(self, include_logs=False):
        d = {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "category": self.category,
            "lat": self.lat,
            "lng": self.lng,
            "photo_filename": self.photo_filename,
            "status": self.status,
            "reporter_name": self.reporter_name,
            "created_at": self.created_at.isoformat()
        }
        return d


class ActionClaim(db.Model):
    __tablename__ = "action_claims"
    id = db.Column(db.Integer, primary_key=True)
    report_id = db.Column(db.Integer, db.ForeignKey("reports.id", ondelete="CASCADE"))
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"))
    status = db.Column(db.String(20), default="claimed")
    completed_at = db.Column(db.DateTime, nullable=True)
    fproof= db.Column(db.String(100), nullable=False)
    desc=db.Column(db.String(800), nullable=True)
    points_awarded = db.Column(db.Integer, default=0)

    report = db.relationship("Report", back_populates="claims")
    user = db.relationship("User", back_populates="claims")

    def to_dict(self):
        return {
            "id": self.id,
            "report_id": self.report_id,
            "user_id": self.user_id,
            "status": self.status,
            "claimed_at": self.claimed_at.isoformat(),
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "points_awarded": self.points_awarded
        }
