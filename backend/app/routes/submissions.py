from flask import Blueprint, request, jsonify
from supabase import Client, create_client
import os
from functools import wraps

bp = Blueprint("submissions", __name__, url_prefix="/api/submissions")

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
def get_submissions():
    user, sb = get_auth_user(request)
    class_id = request.args.get("class_id")

    if class_id:
        class_resp = sb.from_("classes").select("*").eq("id", class_id).eq("teacher_id", user.id).single().execute()
        if not class_resp.data:
            return jsonify({"error": "Forbidden"}), 403
        submissions_resp = sb.from_("submissions").select("*, profiles(name), assignments(title)").eq("class_id", class_id).execute()
    else:
        submissions_resp = sb.from_("submissions").select("*, profiles(name), assignments(title)").execute()

    return jsonify({"submissions": submissions_resp.data if submissions_resp.data else []})


@bp.route("/<string:sub_id>/grade", methods=["PUT"])
@teacher_required
def grade_submission(sub_id):
    data = request.get_json()
    marks = data.get("marks")
    feedback = data.get("feedback", "")

    user, sb = get_auth_user(request)
    sub_resp = sb.from_("submissions").select("*").eq("id", sub_id).single().execute()
    if not sub_resp.data:
        return jsonify({"error": "Submission not found"}), 404

    assignment_resp = sb.from_("assignments").select("class_id").eq("id", sub_resp.data["assignment_id"]).single().execute()
    if assignment_resp.data:
        class_resp = sb.from_("classes").select("*").eq("id", assignment_resp.data["class_id"]).eq("teacher_id", user.id).single().execute()
        if not class_resp.data:
            return jsonify({"error": "Forbidden"}), 403

    result_resp = sb.from_("submissions").update({"marks": marks, "feedback": feedback, "graded_at": "now"}).eq("id", sub_id).select().single().execute()
    return jsonify({"submission": result_resp.data})


@bp.route("/me", methods=["GET"])
def get_my_submissions():
    user, sb = get_auth_user(request)
    if not user:
        return jsonify({"error": "No token"}), 401

    profile_resp = sb.from_("profiles").select("role").eq("auth_user_id", user.id).single().execute()
    role = profile_resp.data.get("role") if profile_resp.data else None

    if role != "student":
        return jsonify({"error": "Forbidden"}), 403

    student_id = profile_resp.data.get("id")
    submissions_resp = sb.from_("submissions").select("*, assignments(title), assignments(class_id)").eq("student_id", student_id).execute()
    return jsonify({"submissions": submissions_resp.data if submissions_resp.data else []})

submissions_bp = bp
