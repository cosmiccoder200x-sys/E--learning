from flask import Blueprint, request, jsonify
from supabase import Client, create_client
import os
from functools import wraps

bp = Blueprint("classes", __name__, url_prefix="/api/classes")

def get_supabase() -> Client:
    return create_client(os.getenv("VITE_SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY"))

def get_user_from_request(req):
    auth_header = req.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "") if auth_header.startswith("Bearer ") else ""
    if not token:
        return None
    sb = get_supabase()
    try:
        response = sb.auth.get_user(token)
        return response.user if response and response.user else None
    except Exception:
        return None

def teacher_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        user = get_user_from_request(request)
        if not user:
            return jsonify({"error": "Unauthorized"}), 401
        sb = get_supabase()
        profile_resp = sb.from_("profiles").select("role").eq("auth_user_id", user.id).single().execute()
        if not profile_resp.data or profile_resp.data.get("role") != "teacher":
            return jsonify({"error": "Forbidden"}), 403
        return fn(*args, **kwargs)
    return wrapper

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


@bp.route("", methods=["GET"])
def get_classes():
    user, sb = get_auth_user(request)
    if not user:
        return jsonify({"error": "No token"}), 401

    profile_resp = sb.from_("profiles").select("role").eq("auth_user_id", user.id).single().execute()
    role = profile_resp.data.get("role") if profile_resp.data else None

    if role == "teacher":
        classes_resp = sb.from_("classes").select("*").eq("teacher_id", user.id).execute()
        classes = classes_resp.data if classes_resp.data else []
    elif role == "student":
        student_resp = sb.from_("profiles").select("id").eq("auth_user_id", user.id).single().execute()
        student_id = student_resp.data.get("id") if student_resp.data else None
        if student_id:
            enrolled_resp = sb.from_("class_students").select("class_id").eq("student_id", student_id).execute()
            class_ids = [r["class_id"] for r in enrolled_resp.data] if enrolled_resp.data else []
            if class_ids:
                classes_resp = sb.from_("classes").select("*").in_("id", class_ids).execute()
                classes = classes_resp.data if classes_resp.data else []
            else:
                classes = []
        else:
            classes = []
    else:
        classes_resp = sb.from_("classes").select("*").execute()
        classes = classes_resp.data if classes_resp.data else []

    return jsonify({"classes": classes})


@bp.route("", methods=["POST"])
@teacher_required
def create_class():
    data = request.get_json()
    name = data.get("name")
    subject = data.get("subject")
    description = data.get("description", "")
    if not name or not subject:
        return jsonify({"error": "Name and subject required"}), 400

    user, sb = get_auth_user(request)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    result_resp = sb.from_("classes").insert({"name": name, "subject": subject, "description": description, "teacher_id": user.id}).select().single().execute()
    return jsonify({"class": result_resp.data}), 201


@bp.route("/<string:class_id>", methods=["GET"])
def get_class(class_id):
    user, sb = get_auth_user(request)
    if not user:
        return jsonify({"error": "No token"}), 401

    class_resp = sb.from_("classes").select("*").eq("id", class_id).single().execute()
    if not class_resp.data:
        return jsonify({"error": "Class not found"}), 404

    profile_resp = sb.from_("profiles").select("role").eq("auth_user_id", user.id).single().execute()
    role = profile_resp.data.get("role") if profile_resp.data else None

    if role == "teacher" and class_resp.data.get("teacher_id") != user.id:
        return jsonify({"error": "Forbidden"}), 403

    if role == "student":
        student_resp = sb.from_("profiles").select("id").eq("auth_user_id", user.id).single().execute()
        student_id = student_resp.data.get("id") if student_resp.data else None
        if student_id:
            enrolled_resp = sb.from_("class_students").select("*").eq("class_id", class_id).eq("student_id", student_id).execute()
            if not enrolled_resp.data:
                return jsonify({"error": "Not enrolled"}), 403

    return jsonify({"class": class_resp.data})


@bp.route("/<string:class_id>", methods=["PUT"])
@teacher_required
def update_class(class_id):
    data = request.get_json()
    user, sb = get_auth_user(request)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    class_resp = sb.from_("classes").select("*").eq("id", class_id).eq("teacher_id", user.id).single().execute()
    if not class_resp.data:
        return jsonify({"error": "Class not found or forbidden"}), 404

    result_resp = sb.from_("classes").update(data).eq("id", class_id).select().single().execute()
    return jsonify({"class": result_resp.data})


@bp.route("/<string:class_id>", methods=["DELETE"])
@teacher_required
def delete_class(class_id):
    user, sb = get_auth_user(request)
    sb.from_("classes").delete().eq("id", class_id).eq("teacher_id", user.id).execute()
    return jsonify({"message": "Class deleted"}), 200


@bp.route("/<string:class_id>/students", methods=["GET"])
@teacher_required
def get_class_students(class_id):
    user, sb = get_auth_user(request)
    students_resp = sb.from_("class_students").select("*, profiles(name, email, avatar_url)").eq("class_id", class_id).execute()
    return jsonify({"students": students_resp.data if students_resp.data else []})


@bp.route("/<string:class_id>/students", methods=["POST"])
@teacher_required
def add_student(class_id):
    data = request.get_json()
    student_email = data.get("student_email")
    if not student_email:
        return jsonify({"error": "student_email required"}), 400

    user, sb = get_auth_user(request)
    student_resp = sb.from_("profiles").select("id").eq("email", student_email).single().execute()
    if not student_resp.data:
        return jsonify({"error": "Student not found"}), 404

    result_resp = sb.from_("class_students").insert({"class_id": class_id, "student_id": student_resp.data.get("id")}).select().single().execute()
    return jsonify({"student": result_resp.data}), 201

classes_bp = bp