from flask import Blueprint, request, jsonify, g
from datetime import datetime, timezone
from app.utils.auth import (
    auth_required,
    teacher_required,
)

bp = Blueprint("submissions", __name__, url_prefix="/api/submissions")


@bp.route("", methods=["GET"])
@teacher_required
def get_submissions():
    profile = g.profile
    sb = g.sb
    class_id = request.args.get("class_id")

    classes_resp = sb.from_("classes").select("id").eq("teacher_id", profile["id"]).execute()
    teacher_class_ids = [c["id"] for c in classes_resp.data] if classes_resp.data else []

    if not teacher_class_ids:
        return jsonify({"submissions": []})

    if class_id:
        if class_id not in teacher_class_ids:
            return jsonify({"error": "Forbidden: You do not own this class"}), 403
        target_class_ids = [class_id]
    else:
        target_class_ids = teacher_class_ids

    # Find assignments in those classes
    assignments_resp = sb.from_("assignments").select("id").in_("class_id", target_class_ids).execute()
    assignment_ids = [a["id"] for a in assignments_resp.data] if assignments_resp.data else []

    if not assignment_ids:
        return jsonify({"submissions": []})

    submissions_resp = (
        sb.from_("submissions")
        .select("*, profiles:student_id(id, name, email, avatar_url), assignments(id, title, class_id, classes(name, subject))")
        .in_("assignment_id", assignment_ids)
        .order("submitted_at", desc=True)
        .execute()
    )
    return jsonify({"submissions": submissions_resp.data if submissions_resp.data else []})


@bp.route("/<string:sub_id>/grade", methods=["PUT"])
@teacher_required
def grade_submission(sub_id):
    data = request.get_json() or {}
    marks = data.get("marks")
    feedback = data.get("feedback", "")

    if marks is None:
        return jsonify({"error": "Marks are required"}), 400

    profile = g.profile
    sb = g.sb

    sub_resp = sb.from_("submissions").select("*").eq("id", sub_id).single().execute()
    if not sub_resp.data:
        return jsonify({"error": "Submission not found"}), 404

    assignment_resp = sb.from_("assignments").select("class_id").eq("id", sub_resp.data["assignment_id"]).single().execute()
    if assignment_resp.data:
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

    now_iso = datetime.now(timezone.utc).isoformat()
    result_resp = (
        sb.from_("submissions")
        .update({
            "marks": marks,
            "feedback": feedback,
            "graded_at": now_iso,
        })
        .eq("id", sub_id)
        .select("*, profiles:student_id(name, email), assignments(title)")
        .single()
        .execute()
    )
    return jsonify({"submission": result_resp.data})


@bp.route("/me", methods=["GET"])
@auth_required
def get_my_submissions():
    profile = g.profile
    sb = g.sb

    if profile.get("role") != "student":
        return jsonify({"error": "Student access only"}), 403

    student_id = profile["id"]
    submissions_resp = (
        sb.from_("submissions")
        .select("*, assignments(id, title, due_date, class_id, classes(name, subject))")
        .eq("student_id", student_id)
        .order("submitted_at", desc=True)
        .execute()
    )
    return jsonify({"submissions": submissions_resp.data if submissions_resp.data else []})


submissions_bp = bp
