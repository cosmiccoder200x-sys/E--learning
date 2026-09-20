from app import create_app

app = create_app()

if __name__ == "__main__":
    app.config["SECRET_KEY"] = app.config.get("SECRET_KEY", "dev-secret-key-change-in-prod")
    app.run(host="0.0.0.0", port=app.config["PORT"], debug=True)
