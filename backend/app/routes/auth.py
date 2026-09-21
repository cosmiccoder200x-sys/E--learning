from flask import Blueprint, request, jsonify
from app.utils.auth import get_supabase, get_auth_context, get_profile_by_auth_id

bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@bp.route("/me", methods=["GET"])
def get_me():
    user, profile, sb = get_auth_context(request)
    if not user or not profile:
        return jsonify({"error": "Invalid token or profile missing"}), 401

    return jsonify({
        "user": {
            "id": profile.get("id"),
            "auth_user_id": user.id,
            "email": user.email,
            "name": profile.get("name"),
            "role": profile.get("role"),
            "avatar_url": profile.get("avatar_url"),
        }
    })


@bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
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

        profile = get_profile_by_auth_id(sb, user.id)
        if not profile:
            return jsonify({"error": "Profile record not found"}), 404

        return jsonify({
            "user": {
                "id": profile.get("id"),
                "auth_user_id": user.id,
                "email": user.email,
                "name": profile.get("name"),
                "role": profile.get("role"),
                "avatar_url": profile.get("avatar_url"),
            },
            "session": {
                "access_token": session.access_token,
                "refresh_token": session.refresh_token,
            },
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 401


@bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")
    name = data.get("name")
    role = data.get("role")

    if not email or not password or not name or not role:
        return jsonify({"error": "All fields required (name, email, password, role)"}), 400

    if role not in ("teacher", "student", "admin"):
        return jsonify({"error": "Invalid role"}), 400

    sb = get_supabase()
    try:
        response = sb.auth.sign_up({"email": email, "password": password})
        user = response.user

        if not user:
            return jsonify({"error": "Registration failed"}), 400

        profile_insert = sb.from_("profiles").insert({
            "auth_user_id": user.id,
            "name": name,
            "email": email,
            "role": role,
        }).select().single().execute()

        profile = profile_insert.data if profile_insert else None
        profile_id = profile.get("id") if profile else None

        login_resp = sb.auth.sign_in_with_password({"email": email, "password": password})
        session = login_resp.session

        return jsonify({
            "message": "User created",
            "user_id": profile_id,
            "auth_user_id": user.id,
            "session": {
                "access_token": session.access_token,
                "refresh_token": session.refresh_token,
            },
        }), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400


auth_bp = bp