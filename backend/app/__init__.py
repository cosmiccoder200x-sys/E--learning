from flask import Flask
from .config import Config
from .extensions import init_extensions
from .routes import register_routes


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(Config)
    Config.validate()

    init_extensions(app)
    register_routes(app)

    return app
