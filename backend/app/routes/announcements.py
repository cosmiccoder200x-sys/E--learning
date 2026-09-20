from flask import Blueprint, request, jsonify
from supabase import Client, create_client
import os
from functools import wraps

bp = Blueprint("announcements", __name__, url_prefix="/api/announcements")

def get_supabase():
    return create_client(os.getenv("VITE_SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY"))

def get_auth_user(req):
    auth_header = req.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "") if auth_header.startswith("Bearer ") else ""
    if not token:
        return None, None
    sb = get_supabase()
    try:
        response = sb.auth.get_user(token)
        user = response.user if response and response.user else None
        if not user:
            return None, None
        return user, sb
    except Exception:
        return None, None

def teacher_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        user, sb = get_auth_user(request)
        if not user:
            return jsonify({"error": "Unauthorized"}), 401
        profile_resp = sb.from_("profiles").select("role").eq("auth_user_id", user.id).single().execute()
        if not profile_resp.data or profile_resp.data.get("role") != "teacher":
            return jsonify({"error": "Forbidden"}), 403
        return fn(*args, **kwargs)
    return wrapper


@bp.route("", methods=["GET"])
def get_announcements():
    user, sb = get_auth_user(request)
    if not user:
        return jsonify({"error": "No token"}), 401

    profile_resp = sb.from_("profiles").select("role").eq("auth_user_id", user.id).single().execute()
    role = profile_resp.data.get("role") if profile_resp.data else None

    if role == "teacher":
        class_id = request.args.get("class_id")
        if class_id:
            announcements_resp = sb.from_("announcements").select("*, profiles(name)").eq("class_id", class_id).order("created_at", desc=True).execute()
            announcements = announcements_resp.data if announcements_resp.data else []
        else:
            announcements = []
    elif role == "student":
        student_resp = sb.from_("profiles").select("id").eq("auth_user_id", user.id).single().execute()
        student_id = student_resp.data.get("id") if student_resp.data else None
        if student_id:
            enrolled_resp = sb.from_("class_students").select("class_id").eq("student_id", student_id).execute()
            class_ids = [c["class_id"] for c in enrolled_resp.data] if enrolled_resp.data else []
            if class_ids:
                announcements_resp = sb.from_("announcements").select("*, profiles(name)").in_("class_id", class_ids).order("created_at", desc=True).execute()
                announcements = announcements_resp.data if announcements_resp.data else []
            else:
                announcements = []
        else:
            announcements = []
    else:
        announcements_resp = sb.from_("announcements").select("*, profiles(name)").order("created_at", desc=True).execute()
        announcements = announcements_resp.data if announcements_resp.data else []

    return jsonify({"announcements": announcements})


@bp.route("", methods=["POST"])
@teacher_required
def create_announcement():
    data = request.get_json()
    class_id = data.get("class_id")
    title = data.get("title")
    message = data.get("message")

    if not class_id or not title or not message:
        return jsonify({"error": "All fields required"}), 400

    user, sb = get_auth_user(request)
    class_resp = sb.from_("classes").select("*").eq("id", class_id).eq("teacher_id", user.id).single().execute()
    if not class_resp.data:
        return jsonify({"error": "Class not found or forbidden"}), 404

    result_resp = sb.from_("announcements").insert({"class_id": class_id, "teacher_id": user.id, "title": title, "message": message}).select().single().execute()
    return jsonify({"announcement": result_resp.data}), 201

announcements_bp = bp
