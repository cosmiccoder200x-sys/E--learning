from flask import Blueprint, request, jsonify, g
from app.utils.auth import (
    auth_required,
    teacher_required,
)

bp = Blueprint("announcements", __name__, url_prefix="/api/announcements")


@bp.route("", methods=["GET"])
@auth_required
def get_announcements():
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
        announcements_resp = (
            sb.from_("announcements")
            .select("*, profiles:teacher_id(name), classes(name, subject)")
            .order("created_at", desc=True)
            .execute()
        )
        return jsonify({"announcements": announcements_resp.data if announcements_resp.data else []})

    if class_ids:
        announcements_resp = (
            sb.from_("announcements")
            .select("*, profiles:teacher_id(name), classes(name, subject)")
            .in_("class_id", class_ids)
            .order("created_at", desc=True)
            .execute()
        )
        announcements = announcements_resp.data if announcements_resp.data else []
    else:
        announcements = []

    return jsonify({"announcements": announcements})


@bp.route("", methods=["POST"])
@teacher_required
def create_announcement():
    data = request.get_json() or {}
    class_id = data.get("class_id")
    title = data.get("title")
    message = data.get("message")

    if not class_id or not title or not message:
        return jsonify({"error": "class_id, title, and message are required"}), 400

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
        sb.from_("announcements")
        .insert({
            "class_id": class_id,
            "teacher_id": profile["id"],
            "title": title,
            "message": message,
        })
        .select("*, profiles:teacher_id(name), classes(name, subject)")
        .single()
        .execute()
    )
    return jsonify({"announcement": result_resp.data}), 201


@bp.route("/<string:ann_id>", methods=["DELETE"])
@teacher_required
def delete_announcement(ann_id):
    profile = g.profile
    sb = g.sb

    ann_resp = sb.from_("announcements").select("*").eq("id", ann_id).single().execute()
    if not ann_resp.data:
        return jsonify({"error": "Announcement not found"}), 404

    if ann_resp.data.get("teacher_id") != profile["id"]:
        return jsonify({"error": "Forbidden: You did not create this announcement"}), 403

    sb.from_("announcements").delete().eq("id", ann_id).execute()
    return jsonify({"message": "Announcement deleted"}), 200


announcements_bp = bp
