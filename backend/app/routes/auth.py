from flask import Blueprint, request, jsonify
from supabase import Client, create_client
import os

bp = Blueprint("auth", __name__, url_prefix="/api/auth")

def get_supabase() -> Client:
    return create_client(
        os.getenv("VITE_SUPABASE_URL"),
        os.getenv("SUPABASE_SERVICE_ROLE_KEY"),
    )


@bp.route("/me", methods=["GET"])
def get_me():
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "") if auth_header.startswith("Bearer ") else ""

    if not token:
        return jsonify({"error": "No token provided"}), 401

    sb = get_supabase()
    try:
        response = sb.auth.get_user(token)
        if not response or not response.user:
            return jsonify({"error": "Invalid token"}), 401

        user = response.user
        # Fetch profile
        profile_resp = (
            sb.from_("profiles").select("*").eq("auth_user_id", user.id).single().execute()
        )
        profile = profile_resp.data if profile_resp.data else None

        if not profile:
            return jsonify({"error": "Profile not found"}), 404

        return jsonify({"user": {"id": user.id, "email": user.email, "name": profile.get("name"), "role": profile.get("role"), "avatar_url": profile.get("avatar_url")}})
    except Exception as e:
        return jsonify({"error": str(e)}), 401


@bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400

    sb = get_supabase()
    try:
        response = sb.auth.sign_in_with_password({"email": email, "password": password})
        user = response.user
        session = response.session

        if not user or not session:
            return jsonify({"error": "Invalid credentials"}), 401

        profile_resp = (
            sb.from_("profiles").select("*").eq("auth_user_id", user.id).single().execute()
        )
        profile = profile_resp.data if profile_resp.data else None

        if not profile:
            return jsonify({"error": "Profile not found"}), 404

        return jsonify({
            "user": {
                "id": user.id,
                "email": user.email,
                "name": profile.get("name"),
                "role": profile.get("role"),
                "avatar_url": profile.get("avatar_url"),
            },
            "session": {"access_token": session.access_token, "refresh_token": session.refresh_token}
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 401


@bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")
    name = data.get("name")
    role = data.get("role")

    if not email or not password or not name or not role:
        return jsonify({"error": "All fields required"}), 400

    if role not in ("teacher", "student", "admin"):
        return jsonify({"error": "Invalid role"}), 400

    sb = get_supabase()
    try:
        response = sb.auth.sign_up({"email": email, "password": password})
        user = response.user

        if not user:
            return jsonify({"error": "Registration failed"}), 400

        sb.from_("profiles").insert({
            "auth_user_id": user.id,
            "name": name,
            "email": email,
            "role": role,
        }).execute()

        return jsonify({"message": "User created", "user_id": user.id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400

auth_bp = bp

auth_bp = bp