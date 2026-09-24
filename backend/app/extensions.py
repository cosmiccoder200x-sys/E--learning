from flask_cors import CORS

cors = CORS()

def init_extensions(app):
    frontend_url = app.config.get("FRONTEND_URL", "http://localhost:5173")
    origins = [frontend_url, "http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]
    cors.init_app(app, resources={r"/api/*": {"origins": origins}})
