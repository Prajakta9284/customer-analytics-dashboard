
import os

from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_cors import CORS

from config import Config
from extensions import db, migrate, jwt

load_dotenv()


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    if not app.config["SECRET_KEY"]:
        app.config["SECRET_KEY"] = os.getenv(
            "SECRET_KEY",
            "dev-only-change-this"
        )

    if not app.config["JWT_SECRET_KEY"]:
        app.config["JWT_SECRET_KEY"] = os.getenv(
            "JWT_SECRET_KEY",
            "dev-only-change-this-too"
        )

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    CORS(
        app,
        resources={
            r"/*": {
                "origins" : [
                    "http://localhost:5173",
                    "http://127.0.0.1:5173"
                ]
            }
        },
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    )

    @app.get("/")
    def home():
        return jsonify({
            "message": "Customer Analytics API",
            "status": "running"
        })

    @app.get("/health/live")
    def live():
        return jsonify({"status": "alive"}), 200

    @app.get("/health/ready")
    def ready():
        try:
            db.session.execute(db.text("SELECT 1"))
            return jsonify({"status": "ready"}), 200
        except Exception:
            db.session.rollback()
            return jsonify({"status": "not ready"}), 503

    from routes import register_routes
    register_routes(app)

    return app


app = create_app()


if __name__ == "__main__":
    app.run(debug=True)
