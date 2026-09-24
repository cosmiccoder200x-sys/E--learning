from flask import Blueprint, request, jsonify, g
from app.utils.auth import (
    auth_required,
    teacher_required,
)

bp = Blueprint("materials", __name__, url_prefix="/api/materials")


@bp.route("", methods=["GET"])
@auth_required
def get_materials():
    profile = g.profile
    sb = g.sb
    role = profile.get("role")
    class_ids = []

    if role in ("teacher", "admin"):
        class_ids_resp = sb.from_("classes").select("id").eq("teacher_id", profile["id"]).execute()
        class_ids = [c["id"] for c in class_ids_resp.data] if class_ids_resp.data else []
    elif role == "student":
        student_id = profile["id"]
        enrolled_resp = sb.from_("class_students").select("class_id").eq("student_id", student_id).execute()
        class_ids = [c["class_id"] for c in enrolled_resp.data] if enrolled_resp.data else []
    else:
        return jsonify({"materials": []})

    if class_ids:
        materials_resp = (
            sb.from_("materials")
            .select("*, classes(name, subject)")
            .in_("class_id", class_ids)
            .order("created_at", desc=True)
            .execute()
        )
        materials = materials_resp.data if materials_resp.data else []
    else:
        materials = []

    return jsonify({"materials": materials})


@bp.route("", methods=["POST"])
@teacher_required
def upload_material():
    data = request.get_json() or {}
    class_id = data.get("class_id")
    title = data.get("title")
    description = data.get("description", "")
    file_url = data.get("file_url", "")
    file_name = data.get("file_name", "")

    if not class_id or not title:
        return jsonify({"error": "Class ID and title required"}), 400

    profile = g.profile
    sb = g.sb

    class_resp = (
        sb.from_("classes")
        .select("*")
        .eq("id", class_id)
        .eq("teacher_id", profile["id"])
        .single()
        .execute()
    )
    if not class_resp.data:
        return jsonify({"error": "Class not found or forbidden"}), 404

    result_resp = (
        sb.from_("materials")
        .insert({
            "class_id": class_id,
            "title": title,
            "description": description,
            "file_url": file_url,
            "file_name": file_name,
            "uploaded_by": profile["id"],
        })
        .select("*, classes(name, subject)")
        .single()
        .execute()
    )
    return jsonify({"material": result_resp.data}), 201


@bp.route("/<string:mat_id>", methods=["DELETE"])
@teacher_required
def delete_material(mat_id):
    profile = g.profile
    sb = g.sb

    material_resp = sb.from_("materials").select("*").eq("id", mat_id).single().execute()
    if not material_resp.data:
        return jsonify({"error": "Material not found"}), 404

    class_resp = (
        sb.from_("classes")
        .select("*")
        .eq("id", material_resp.data["class_id"])
        .eq("teacher_id", profile["id"])
        .single()
        .execute()
    )
    if not class_resp.data:
        return jsonify({"error": "Forbidden: You do not own this class"}), 403

    sb.from_("materials").delete().eq("id", mat_id).execute()
    return jsonify({"message": "Material deleted"}), 200


materials_bp = bp