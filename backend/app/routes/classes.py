from flask import Blueprint, request, jsonify, g
from uuid import uuid4
from app.utils.auth import (
    get_auth_context,
    auth_required,
    teacher_required,
    get_profile_by_email,
)

bp = Blueprint("classes", __name__, url_prefix="/api/classes")


@bp.route("", methods=["GET"])
@auth_required
def get_classes():
    profile = g.profile
    sb = g.sb
    role = profile.get("role")

    if role in ("teacher", "admin"):
        classes_resp = (
            sb.from_("classes")
            .select("*")
            .eq("teacher_id", profile["id"])
            .order("created_at", desc=True)
            .execute()
        )
        classes = classes_resp.data if classes_resp.data else []
    elif role == "student":
        student_id = profile["id"]
        enrolled_resp = (
            sb.from_("class_students")
            .select("class_id")
            .eq("student_id", student_id)
            .execute()
        )
        class_ids = [r["class_id"] for r in enrolled_resp.data] if enrolled_resp.data else []
        if class_ids:
            classes_resp = (
                sb.from_("classes")
                .select("*, profiles:teacher_id(name, email)")
                .in_("id", class_ids)
                .order("created_at", desc=True)
                .execute()
            )
            classes = classes_resp.data if classes_resp.data else []
        else:
            classes = []
    else:
        return jsonify({"classes": []})

    return jsonify({"classes": classes})


@bp.route("", methods=["POST"])
@teacher_required
def create_class():
    data = request.get_json() or {}
    name = data.get("name")
    subject = data.get("subject")
    description = data.get("description", "")

    if not name or not subject:
        return jsonify({"error": "Name and subject required"}), 400

    profile = g.profile
    sb = g.sb

    result_resp = (
        sb.from_("classes")
        .insert({
            "name": name,
            "subject": subject,
            "description": description,
            "teacher_id": profile["id"],
        })
        .select()
        .single()
        .execute()
    )
    return jsonify({"class": result_resp.data}), 201


@bp.route("/<string:class_id>", methods=["GET"])
@auth_required
def get_class(class_id):
    profile = g.profile
    sb = g.sb

    class_resp = sb.from_("classes").select("*, profiles:teacher_id(name, email)").eq("id", class_id).single().execute()
    if not class_resp.data:
        return jsonify({"error": "Class not found"}), 404

    class_data = class_resp.data
    role = profile.get("role")

    if role == "teacher" and class_data.get("teacher_id") != profile["id"]:
        return jsonify({"error": "Forbidden"}), 403

    if role == "student":
        enrolled_resp = (
            sb.from_("class_students")
            .select("*")
            .eq("class_id", class_id)
            .eq("student_id", profile["id"])
            .execute()
        )
        if not enrolled_resp.data:
            return jsonify({"error": "Not enrolled in this class"}), 403

    return jsonify({"class": class_data})


@bp.route("/<string:class_id>", methods=["PUT"])
@teacher_required
def update_class(class_id):
    data = request.get_json() or {}
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

    # Allow update of name, subject, description
    update_payload = {}
    for key in ("name", "subject", "description"):
        if key in data:
            update_payload[key] = data[key]

    result_resp = (
        sb.from_("classes")
        .update(update_payload)
        .eq("id", class_id)
        .select()
        .single()
        .execute()
    )
    return jsonify({"class": result_resp.data})


@bp.route("/<string:class_id>", methods=["DELETE"])
@teacher_required
def delete_class(class_id):
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

    sb.from_("classes").delete().eq("id", class_id).eq("teacher_id", profile["id"]).execute()
    return jsonify({"message": "Class deleted"}), 200


@bp.route("/<string:class_id>/students", methods=["GET"])
@auth_required
def get_class_students(class_id):
    profile = g.profile
    sb = g.sb
    role = profile.get("role")

    # Verify class access
    class_resp = (
        sb.from_("classes")
        .select("*")
        .eq("id", class_id)
        .single()
        .execute()
    )
    if not class_resp.data:
        return jsonify({"error": "Class not found"}), 404

    if role in ("teacher", "admin"):
        pass  # Full access
    elif role == "student":
        enrolled_resp = (
            sb.from_("class_students")
            .select("*")
            .eq("class_id", class_id)
            .eq("student_id", profile["id"])
            .execute()
        )
        if not enrolled_resp.data:
            return jsonify({"error": "Not enrolled in this class"}), 403
    else:
        return jsonify({"error": "Unauthorized"}), 403


@bp.route("/<string:class_id>/students", methods=["POST"])
@teacher_required
def add_student(class_id):
    data = request.get_json() or {}
    student_email = data.get("student_email")
    if not student_email:
        return jsonify({"error": "student_email required"}), 400

    profile = g.profile
    sb = g.sb

    # Verify teacher owns class
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

    student_profile = get_profile_by_email(sb, student_email.strip().lower())
    if not student_profile:
        new_profile_id = str(uuid4())
        name = student_email.split("@")[0].replace(".", " ").title()
        insert_resp = (
            sb.from_("profiles")
            .insert({
                "id": new_profile_id,
                "auth_user_id": new_profile_id,
                "name": name,
                "email": student_email.strip().lower(),
                "role": "student",
            })
            .select()
            .single()
            .execute()
        )
        student_profile = insert_resp.data if insert_resp.data else None
        if not student_profile:
            return jsonify({"error": "Failed to create student profile"}), 400

    try:
        result_resp = (
            sb.from_("class_students")
            .insert({
                "class_id": class_id,
                "student_id": student_profile["id"],
            })
            .select("*, profiles:student_id(id, name, email, avatar_url)")
            .single()
            .execute()
        )
        return jsonify({"student": result_resp.data}), 201
    except Exception as e:
        return jsonify({"error": f"Failed to add student: {str(e)}"}), 400


classes_bp = bp