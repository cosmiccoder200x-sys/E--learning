from flask import Blueprint, request, jsonify
from supabase import Client, create_client
import os
from functools import wraps

bp = Blueprint("students", __name__, url_prefix="/api/students")

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
def get_students():
    user, sb = get_auth_user(request)
    students_resp = sb.from_("profiles").select("*").eq("role", "student").execute()
    return jsonify({"students": students_resp.data if students_resp.data else []})


@bp.route("/<string:student_id>", methods=["GET"])
@teacher_required
def get_student(student_id):
    user, sb = get_auth_user(request)
    student_resp = sb.from_("profiles").select("*").eq("id", student_id).single().execute()
    if not student_resp.data:
        return jsonify({"error": "Student not found"}), 404
    return jsonify({"student": student_resp.data})

students_bp = bp