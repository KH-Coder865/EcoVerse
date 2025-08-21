import os, uuid
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app, send_from_directory
from werkzeug.utils import secure_filename
from main import db
from models.models import User, Report, ReportLog, ActionClaim

bp = Blueprint("api", __name__)

# ---------- Helpers ----------
def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in current_app.config["ALLOWED_EXTENSIONS"]

# ---------- Reports ----------
@bp.route("/report", methods=["POST"])
def create_report():
    data = request.form
    title = data.get("title", "")
    description = data.get("description", "")
    category = data.get("category")
    lat, lng = data.get("lat"), data.get("lng")
    reporter_name = data.get("reporter_name", "anonymous")

    if not category or lat is None or lng is None:
        return jsonify({"error": "category, lat and lng are required"}), 400

    photo = request.files.get("photo")
    filename = None
    if photo and photo.filename != "":
        if not allowed_file(photo.filename):
            return jsonify({"error": "invalid file type"}), 400
        fname = secure_filename(photo.filename)
        unique = f"{uuid.uuid4().hex}_{fname}"
        path = os.path.join(current_app.config["UPLOAD_FOLDER"], unique)
        photo.save(path)
        filename = unique

    report = Report(
        title=title, description=description, category=category,
        lat=float(lat), lng=float(lng),
        photo_filename=filename, reporter_name=reporter_name
    )
    db.session.add(report)
    db.session.commit()

    log = ReportLog(report_id=report.id, action="created", actor=reporter_name, details="Report submitted")
    db.session.add(log)
    db.session.commit()

    return jsonify({"report": report.to_dict()}), 201

@bp.route("/reports", methods=["GET"])
def list_reports():
    status, category = request.args.get("status"), request.args.get("category")
    q = Report.query
    if status: q = q.filter_by(status=status)
    if category: q = q.filter_by(category=category)
    return jsonify([r.to_dict() for r in q.order_by(Report.created_at.desc()).all()])

@bp.route("/report/<int:report_id>", methods=["GET"])
def get_report(report_id):
    return jsonify(Report.query.get_or_404(report_id).to_dict(include_logs=True))

@bp.route("/uploads/<path:filename>", methods=["GET"])
def get_upload(filename):
    return send_from_directory(current_app.config["UPLOAD_FOLDER"], filename)

# ---------- Verification ----------
@bp.route("/report/<int:report_id>/verify", methods=["PUT"])
def verify_report(report_id):
    payload = request.json or {}
    actor, details = payload.get("actor", "verifier"), payload.get("details", "")
    report = Report.query.get_or_404(report_id)
    report.status = "verified"
    db.session.add(report)
    db.session.add(ReportLog(report_id=report.id, action="verified", actor=actor, details=details))
    db.session.commit()
    return jsonify({"message": "report verified", "report": report.to_dict(include_logs=True)})

@bp.route("/report/<int:report_id>/resolve", methods=["PUT"])
def resolve_report(report_id):
    payload = request.json or {}
    actor, details = payload.get("actor", "resolver"), payload.get("details", "")
    report = Report.query.get_or_404(report_id)
    report.status = "resolved"
    db.session.add(report)
    db.session.add(ReportLog(report_id=report.id, action="resolved", actor=actor, details=details))
    db.session.commit()
    return jsonify({"message": "report resolved", "report": report.to_dict(include_logs=True)})

# ---------- Actions ----------
@bp.route("/action/claim/<int:report_id>", methods=["POST"])
def claim_action(report_id):
    payload = request.json or {}
    username = payload.get("username")
    if not username:
        return jsonify({"error": "username required"}), 400

    user = User.query.filter_by(username=username).first()
    if not user:
        user = User(username=username, display_name=username)
        db.session.add(user); db.session.commit()

    report = Report.query.get_or_404(report_id)
    claim = ActionClaim(report_id=report.id, user_id=user.id, status="claimed")
    db.session.add(claim)
    db.session.add(ReportLog(report_id=report.id, action="claimed", actor=user.username, details="Task claimed"))
    db.session.commit()
    return jsonify({"message": "task claimed", "claim": claim.to_dict(), "report": report.to_dict(include_logs=True)}), 201

@bp.route("/action/complete/<int:claim_id>", methods=["POST"])
def complete_action(claim_id):
    payload = request.json or {}
    actor, details = payload.get("actor"), payload.get("details", "completed")
    points = int(payload.get("points", 10))

    claim = ActionClaim.query.get_or_404(claim_id)
    if claim.status == "completed":
        return jsonify({"message": "already completed", "claim": claim.to_dict()})

    claim.status, claim.completed_at, claim.points_awarded = "completed", datetime.utcnow(), points
    user = claim.user
    if user: user.eco_points += points
    report = claim.report
    report.status = "resolved"
    db.session.add_all([claim, user, report])
    db.session.add(ReportLog(report_id=report.id, action="completed", actor=actor or user.username, details=f"{details}|points={points}"))
    db.session.commit()
    return jsonify({"message": "claim completed", "claim": claim.to_dict(), "user": user.to_dict(), "report": report.to_dict(include_logs=True)})

# ---------- Leaderboard ----------
@bp.route("/leaderboard", methods=["GET"])
def leaderboard():
    limit = int(request.args.get("limit", 10))
    return jsonify([u.to_dict() for u in User.query.order_by(User.eco_points.desc()).limit(limit).all()])
