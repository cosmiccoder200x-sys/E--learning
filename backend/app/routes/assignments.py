from flask import Blueprint, request, jsonify
from supabase import Client, create_client
import os
from functools import wraps

bp = Blueprint("assignments", __name__, url_prefix="/api/assignments")

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
def get_assignments():
    user, sb = get_auth_user(request)
    if not user:
        return jsonify({"error": "No token"}), 401

    profile_resp = sb.from_("profiles").select("role").eq("auth_user_id", user.id).single().execute()
    role = profile_resp.data.get("role") if profile_resp.data else None
    class_ids = []

    if role == "teacher":
        class_id = request.args.get("class_id")
        if class_id:
            class_ids = [class_id]
    elif role == "student":
        student_resp = sb.from_("profiles").select("id").eq("auth_user_id", user.id).single().execute()
        student_id = student_resp.data.get("id") if student_resp.data else None
        if student_id:
            enrolled_resp = sb.from_("class_students").select("class_id").eq("student_id", student_id).execute()
            class_ids = [c["class_id"] for c in enrolled_resp.data] if enrolled_resp.data else []

    if class_ids:
        assignments_resp = sb.from_("assignments").select("*").in_("class_id", class_ids).execute()
        assignments = assignments_resp.data if assignments_resp.data else []
    else:
        assignments = []

    return jsonify({"assignments": assignments})


@bp.route("", methods=["POST"])
@teacher_required
def create_assignment():
    data = request.get_json()
    class_id = data.get("class_id")
    title = data.get("title")
    description = data.get("description", "")
    due_date = data.get("due_date")
    attachment_url = data.get("attachment_url", "")

    if not class_id or not title:
        return jsonify({"error": "Class ID and title required"}), 400

    user, sb = get_auth_user(request)
    class_resp = sb.from_("classes").select("*").eq("id", class_id).eq("teacher_id", user.id).single().execute()
    if not class_resp.data:
        return jsonify({"error": "Class not found or forbidden"}), 404

    result_resp = sb.from_("assignments").insert({"class_id": class_id, "title": title, "description": description, "due_date": due_date, "attachment_url": attachment_url, "created_by": user.id}).select().single().execute()
    return jsonify({"assignment": result_resp.data}), 201


@bp.route("/<string:assign_id>", methods=["GET"])
def get_assignment(assign_id):
    user, sb = get_auth_user(request)
    if not user:
        return jsonify({"error": "No token"}), 401

    assignment_resp = sb.from_("assignments").select("*").eq("id", assign_id).single().execute()
    if not assignment_resp.data:
        return jsonify({"error": "Assignment not found"}), 404

    profile_resp = sb.from_("profiles").select("role").eq("auth_user_id", user.id).single().execute()
    role = profile_resp.data.get("role") if profile_resp.data else None

    if role == "student":
        student_resp = sb.from_("profiles").select("id").eq("auth_user_id", user.id).single().execute()
        student_id = student_resp.data.get("id") if student_resp.data else None
        enrolled_resp = sb.from_("class_students").select("*").eq("class_id", assignment_resp.data["class_id"]).eq("student_id", student_id).execute()
        if not enrolled_resp.data:
            return jsonify({"error": "Not enrolled in this class"}), 403

    return jsonify({"assignment": assignment_resp.data})


@bp.route("/<string:assign_id>/submit", methods=["POST"])
def submit_assignment(assign_id):
    data = request.get_json()
    file_url = data.get("file_url", "")
    text_answer = data.get("text_answer", "")

    user, sb = get_auth_user(request)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    assignment_resp = sb.from_("assignments").select("*").eq("id", assign_id).single().execute()
    if not assignment_resp.data:
        return jsonify({"error": "Assignment not found"}), 404

    student_resp = sb.from_("profiles").select("id").eq("auth_user_id", user.id).single().execute()
    student_id = student_resp.data.get("id") if student_resp.data else None

    result_resp = sb.from_("submissions").insert({"assignment_id": assign_id, "student_id": student_id, "file_url": file_url, "text_answer": text_answer, "submitted_at": "now"}).select().single().execute()
    return jsonify({"submission": result_resp.data}), 201

assignments_bp = bp
