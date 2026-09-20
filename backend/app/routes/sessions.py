from flask import Blueprint, request, jsonify
from supabase import Client, create_client
import os
from functools import wraps

bp = Blueprint("sessions", __name__, url_prefix="/api/sessions")

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
def get_sessions():
    user, sb = get_auth_user(request)
    if not user:
        return jsonify({"error": "No token"}), 401

    profile_resp = sb.from_("profiles").select("role").eq("auth_user_id", user.id).single().execute()
    role = profile_resp.data.get("role") if profile_resp.data else None

    class_ids = []
    if role == "teacher":
        classes_resp = sb.from_("classes").select("id").eq("teacher_id", user.id).execute()
        class_ids = [c["id"] for c in classes_resp.data] if classes_resp.data else []
    elif role == "student":
        student_resp = sb.from_("profiles").select("id").eq("auth_user_id", user.id).single().execute()
        student_id = student_resp.data.get("id") if student_resp.data else None
        if student_id:
            enrolled_resp = sb.from_("class_students").select("class_id").eq("student_id", student_id).execute()
            class_ids = [c["class_id"] for c in enrolled_resp.data] if enrolled_resp.data else []
    else:
        classes_resp = sb.from_("classes").select("id").execute()
        class_ids = [c["id"] for c in classes_resp.data] if classes_resp.data else []

    if class_ids:
        sessions_resp = sb.from_("sessions").select("*").in_("class_id", class_ids).execute()
        sessions = sessions_resp.data if sessions_resp.data else []
    else:
        sessions = []

    return jsonify({"sessions": sessions})


@bp.route("", methods=["POST"])
@teacher_required
def create_session():
    data = request.get_json()
    class_id = data.get("class_id")
    title = data.get("title")
    description = data.get("description", "")
    session_date = data.get("session_date")
    start_time = data.get("start_time")
    end_time = data.get("end_time")
    meet_link = data.get("meet_link", "")

    if not class_id or not title or not session_date or not start_time:
        return jsonify({"error": "Required fields missing"}), 400

    user, sb = get_auth_user(request)
    class_resp = sb.from_("classes").select("*").eq("id", class_id).eq("teacher_id", user.id).single().execute()
    if not class_resp.data:
        return jsonify({"error": "Class not found or forbidden"}), 404

    result_resp = sb.from_("sessions").insert({"class_id": class_id, "title": title, "description": description, "session_date": session_date, "start_time": start_time, "end_time": end_time, "meet_link": meet_link}).select().single().execute()
    return jsonify({"session": result_resp.data}), 201


@bp.route("/<string:session_id>", methods=["PUT"])
@teacher_required
def update_session(session_id):
    data = request.get_json()
    user, sb = get_auth_user(request)
    session_resp = sb.from_("sessions").select("*").eq("id", session_id).execute()
    if not session_resp.data:
        return jsonify({"error": "Session not found"}), 404

    class_resp = sb.from_("classes").select("*").eq("id", session_resp.data[0]["class_id"]).eq("teacher_id", user.id).single().execute()
    if not class_resp.data:
        return jsonify({"error": "Forbidden"}), 403

    result_resp = sb.from_("sessions").update(data).eq("id", session_id).select().single().execute()
    return jsonify({"session": result_resp.data})


@bp.route("/<string:session_id>", methods=["DELETE"])
@teacher_required
def delete_session(session_id):
    user, sb = get_auth_user(request)
    session_resp = sb.from_("sessions").select("*").eq("id", session_id).execute()
    if not session_resp.data:
        return jsonify({"error": "Session not found"}), 404
    class_resp = sb.from_("classes").select("*").eq("id", session_resp.data[0]["class_id"]).eq("teacher_id", user.id).single().execute()
    if not class_resp.data:
        return jsonify({"error": "Forbidden"}), 403
    sb.from_("sessions").delete().eq("id", session_id).execute()
    return jsonify({"message": "Session deleted"}), 200

sessions_bp = bp