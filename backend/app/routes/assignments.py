from flask import Blueprint, request, jsonify, g
from datetime import datetime, timezone
from app.utils.auth import (
    auth_required,
    teacher_required,
)

bp = Blueprint("assignments", __name__, url_prefix="/api/assignments")


@bp.route("", methods=["GET"])
@auth_required
def get_assignments():
    profile = g.profile
    sb = g.sb
    role = profile.get("role")
    class_ids = []

    if role in ("teacher", "admin"):
        class_id = request.args.get("class_id")
        if class_id:
            class_ids = [class_id]
        else:
            classes_resp = sb.from_("classes").select("id").eq("teacher_id", profile["id"]).execute()
            class_ids = [c["id"] for c in classes_resp.data] if classes_resp.data else []
    elif role == "student":
        student_id = profile["id"]
        enrolled_resp = sb.from_("class_students").select("class_id").eq("student_id", student_id).execute()
        class_ids = [c["class_id"] for c in enrolled_resp.data] if enrolled_resp.data else []
    else:
        return jsonify({"assignments": []})

    if class_ids:
        assignments_resp = (
            sb.from_("assignments")
            .select("*, classes(name, subject)")
            .in_("class_id", class_ids)
            .order("created_at", desc=True)
            .execute()
        )
        assignments = assignments_resp.data if assignments_resp.data else []
    else:
        assignments = []

    return jsonify({"assignments": assignments})


@bp.route("", methods=["POST"])
@teacher_required
def create_assignment():
    data = request.get_json() or {}
    class_id = data.get("class_id")
    title = data.get("title")
    description = data.get("description", "")
    due_date = data.get("due_date")
    attachment_url = data.get("attachment_url", "")

    if not class_id or not title:
        return jsonify({"error": "Class ID and title required"}), 400

    profile = g.profile
    sb = g.sb

    # Verify teacher owns the class
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
        sb.from_("assignments")
        .insert({
            "class_id": class_id,
            "title": title,
            "description": description,
            "due_date": due_date,
            "attachment_url": attachment_url,
            "created_by": profile["id"],
        })
        .select("*, classes(name, subject)")
        .single()
        .execute()
    )
    return jsonify({"assignment": result_resp.data}), 201


@bp.route("/<string:assign_id>", methods=["GET"])
@auth_required
def get_assignment(assign_id):
    profile = g.profile
    sb = g.sb

    assignment_resp = (
        sb.from_("assignments")
        .select("*, classes(name, subject, teacher_id)")
        .eq("id", assign_id)
        .single()
        .execute()
    )
    if not assignment_resp.data:
        return jsonify({"error": "Assignment not found"}), 404

    assignment = assignment_resp.data
    role = profile.get("role")

    if role == "student":
        enrolled_resp = (
            sb.from_("class_students")
            .select("*")
            .eq("class_id", assignment["class_id"])
            .eq("student_id", profile["id"])
            .execute()
        )
        if not enrolled_resp.data:
            return jsonify({"error": "Not enrolled in this class"}), 403

    return jsonify({"assignment": assignment})


@bp.route("/<string:assign_id>/submit", methods=["POST"])
@auth_required
def submit_assignment(assign_id):
    data = request.get_json() or {}
    file_url = data.get("file_url", "")
    text_answer = data.get("text_answer", "")

    profile = g.profile
    sb = g.sb

    if profile.get("role") != "student":
        return jsonify({"error": "Only students can submit assignments"}), 403

    assignment_resp = sb.from_("assignments").select("*").eq("id", assign_id).single().execute()
    if not assignment_resp.data:
        return jsonify({"error": "Assignment not found"}), 404

    # Verify student is enrolled in class
    enrolled_resp = (
        sb.from_("class_students")
        .select("*")
        .eq("class_id", assignment_resp.data["class_id"])
        .eq("student_id", profile["id"])
        .execute()
    )
    if not enrolled_resp.data:
        return jsonify({"error": "Not enrolled in this class"}), 403

    result_resp = (
        sb.from_("submissions")
        .upsert({
            "assignment_id": assign_id,
            "student_id": profile["id"],
            "file_url": file_url,
            "text_answer": text_answer,
            "submitted_at": datetime.now(timezone.utc).isoformat(),
        }, on_conflict="assignment_id,student_id")
        .select()
        .single()
        .execute()
    )
    return jsonify({"submission": result_resp.data}), 201


@bp.route("/<string:assign_id>", methods=["DELETE"])
@teacher_required
def delete_assignment(assign_id):
    profile = g.profile
    sb = g.sb

    assignment_resp = sb.from_("assignments").select("*").eq("id", assign_id).single().execute()
    if not assignment_resp.data:
        return jsonify({"error": "Assignment not found"}), 404

    class_resp = (
        sb.from_("classes")
        .select("*")
        .eq("id", assignment_resp.data["class_id"])
        .eq("teacher_id", profile["id"])
        .single()
        .execute()
    )
    if not class_resp.data:
        return jsonify({"error": "Forbidden: You do not own this class"}), 403

    sb.from_("assignments").delete().eq("id", assign_id).execute()
    return jsonify({"message": "Assignment deleted"}), 200


assignments_bp = bp
