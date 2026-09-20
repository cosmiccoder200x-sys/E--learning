from flask import Blueprint, request, jsonify
from supabase import Client, create_client
import os
from functools import wraps

bp = Blueprint("materials", __name__, url_prefix="/api/materials")

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
def get_materials():
    user, sb = get_auth_user(request)
    if not user:
        return jsonify({"error": "No token"}), 401

    profile_resp = sb.from_("profiles").select("role").eq("auth_user_id", user.id).single().execute()
    role = profile_resp.data.get("role") if profile_resp.data else None
    class_ids = []

    if role == "teacher":
        class_ids_resp = sb.from_("classes").select("id").eq("teacher_id", user.id).execute()
        class_ids = [c["id"] for c in class_ids_resp.data] if class_ids_resp.data else []
    elif role == "student":
        student_resp = sb.from_("profiles").select("id").eq("auth_user_id", user.id).single().execute()
        student_id = student_resp.data.get("id") if student_resp.data else None
        if student_id:
            enrolled_resp = sb.from_("class_students").select("class_id").eq("student_id", student_id).execute()
            class_ids = [c["class_id"] for c in enrolled_resp.data] if enrolled_resp.data else []

    if class_ids:
        materials_resp = sb.from_("materials").select("*").in_("class_id", class_ids).execute()
        materials = materials_resp.data if materials_resp.data else []
    else:
        materials = []

    return jsonify({"materials": materials})


@bp.route("", methods=["POST"])
@teacher_required
def upload_material():
    data = request.get_json()
    class_id = data.get("class_id")
    title = data.get("title")
    description = data.get("description", "")
    file_url = data.get("file_url", "")
    file_name = data.get("file_name", "")

    if not class_id or not title:
        return jsonify({"error": "Class ID and title required"}), 400

    user, sb = get_auth_user(request)
    class_resp = sb.from_("classes").select("*").eq("id", class_id).eq("teacher_id", user.id).single().execute()
    if not class_resp.data:
        return jsonify({"error": "Class not found or forbidden"}), 404

    result_resp = sb.from_("materials").insert({"class_id": class_id, "title": title, "description": description, "file_url": file_url, "file_name": file_name, "uploaded_by": user.id}).select().single().execute()
    return jsonify({"material": result_resp.data}), 201


@bp.route("/<string:mat_id>", methods=["DELETE"])
@teacher_required
def delete_material(mat_id):
    user, sb = get_auth_user(request)
    material_resp = sb.from_("materials").select("*").eq("id", mat_id).execute()
    if not material_resp.data:
        return jsonify({"error": "Material not found"}), 404
    class_resp = sb.from_("classes").select("*").eq("id", material_resp.data[0]["class_id"]).eq("teacher_id", user.id).single().execute()
    if not class_resp.data:
        return jsonify({"error": "Forbidden"}), 403
    sb.from_("materials").delete().eq("id", mat_id).execute()
    return jsonify({"message": "Material deleted"}), 200

materials_bp = bp