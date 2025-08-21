from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
import os

db = SQLAlchemy()
migrate = Migrate()

def create_app():
    app = Flask(__name__, static_folder="statics", template_folder="templates")

    # Config
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-key")
    app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get(
        "DATABASE_URL", f"sqlite:///{os.path.join(BASE_DIR, 'database.db')}"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["UPLOAD_FOLDER"] = os.path.join(BASE_DIR, "statics", "uploads")
    app.config["ALLOWED_EXTENSIONS"] = {"png", "jpg", "jpeg", "gif"}

    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    db.init_app(app)
    migrate.init_app(app, db)

    # Import models so migrations can detect them
    from models import models as m

    # Register routes
    from controllers.cotrollers import bp as api_bp
    app.register_blueprint(api_bp, url_prefix="/api")

    @app.route("/api/ping")
    def ping():
        return jsonify({"status": "ok", "service": "EcoVerse backend"})

    return app


if __name__ == "__main__":
    app = create_app()
    with app.app_context():
        db.create_all()
    app.run(host="0.0.0.0", port=5000, debug=True)
