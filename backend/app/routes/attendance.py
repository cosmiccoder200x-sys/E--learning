from flask import Blueprint, request, jsonify
from supabase import Client, create_client
import os
from functools import wraps

bp = Blueprint("attendance", __name__, url_prefix="/api/attendance")

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
@teacher_required
def get_attendance():
    user, sb = get_auth_user(request)
    session_id = request.args.get("session_id")
    if session_id:
        attendance_resp = sb.from_("attendance").select("*, profiles(name)").eq("session_id", session_id).execute()
        attendance = attendance_resp.data if attendance_resp.data else []
    else:
        attendance = []
    return jsonify({"attendance": attendance})


@bp.route("", methods=["POST"])
@teacher_required
def mark_attendance():
    data = request.get_json()
    session_id = data.get("session_id")
    student_id = data.get("student_id")
    status = data.get("status")

    if not session_id or not student_id or not status:
        return jsonify({"error": "session_id, student_id, status required"}), 400

    if status not in ("present", "absent", "late"):
        return jsonify({"error": "Invalid status"}), 400

    user, sb = get_auth_user(request)
    session_resp = sb.from_("sessions").select("*").eq("id", session_id).single().execute()
    if not session_resp.data:
        return jsonify({"error": "Session not found"}), 404

    class_resp = sb.from_("classes").select("*").eq("id", session_resp.data["class_id"]).eq("teacher_id", user.id).single().execute()
    if not class_resp.data:
        return jsonify({"error": "Forbidden"}), 403

    existing_resp = sb.from_("attendance").select("*").eq("session_id", session_id).eq("student_id", student_id).single().execute()
    if existing_resp.data:
        result_resp = sb.from_("attendance").update({"status": status, "marked_at": "now"}).eq("id", existing_resp.data["id"]).select().single().execute()
        return jsonify({"attendance": result_resp.data})

    result_resp = sb.from_("attendance").insert({"session_id": session_id, "student_id": student_id, "status": status, "marked_at": "now"}).select().single().execute()
    return jsonify({"attendance": result_resp.data}), 201


@bp.route("/session/<string:session_id>", methods=["GET"])
def get_student_attendance(session_id):
    user, sb = get_auth_user(request)
    if not user:
        return jsonify({"error": "No token"}), 401

    student_resp = sb.from_("profiles").select("id").eq("auth_user_id", user.id).single().execute()
    student_id = student_resp.data.get("id") if student_resp.data else None

    attendance_resp = sb.from_("attendance").select("*, sessions(title)").eq("student_id", student_id).eq("session_id", session_id).execute()
    return jsonify({"attendance": attendance_resp.data if attendance_resp.data else []})

attendance_bp = bp
