from flask import Blueprint, request, jsonify, g
from app.utils.auth import (
    auth_required,
    teacher_required,
)

bp = Blueprint("sessions", __name__, url_prefix="/api/sessions")


@bp.route("", methods=["GET"])
@auth_required
def get_sessions():
    profile = g.profile
    sb = g.sb
    role = profile.get("role")
    class_ids = []

    if role in ("teacher", "admin"):
        classes_resp = sb.from_("classes").select("id").eq("teacher_id", profile["id"]).execute()
        class_ids = [c["id"] for c in classes_resp.data] if classes_resp.data else []
    elif role == "student":
        student_id = profile["id"]
        enrolled_resp = sb.from_("class_students").select("class_id").eq("student_id", student_id).execute()
        class_ids = [c["class_id"] for c in enrolled_resp.data] if enrolled_resp.data else []
    else:
        return jsonify({"sessions": []})

    if class_ids:
        sessions_resp = (
            sb.from_("sessions")
            .select("*, classes(name, subject)")
            .in_("class_id", class_ids)
            .order("session_date")
            .order("start_time")
            .execute()
        )
        sessions = sessions_resp.data if sessions_resp.data else []
    else:
        sessions = []

    return jsonify({"sessions": sessions})


@bp.route("", methods=["POST"])
@teacher_required
def create_session():
    data = request.get_json() or {}
    class_id = data.get("class_id")
    title = data.get("title")
    description = data.get("description", "")
    session_date = data.get("session_date")
    start_time = data.get("start_time")
    end_time = data.get("end_time")
    meet_link = data.get("meet_link", "")

    if not class_id or not title or not session_date or not start_time:
        return jsonify({"error": "Required fields missing (class_id, title, session_date, start_time)"}), 400

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
        sb.from_("sessions")
        .insert({
            "class_id": class_id,
            "title": title,
            "description": description,
            "session_date": session_date,
            "start_time": start_time,
            "end_time": end_time,
            "meet_link": meet_link,
        })
        .select("*, classes(name, subject)")
        .single()
        .execute()
    )
    return jsonify({"session": result_resp.data}), 201


@bp.route("/<string:session_id>", methods=["PUT"])
@teacher_required
def update_session(session_id):
    data = request.get_json() or {}
    profile = g.profile
    sb = g.sb

    session_resp = sb.from_("sessions").select("*").eq("id", session_id).single().execute()
    if not session_resp.data:
        return jsonify({"error": "Session not found"}), 404

    class_resp = (
        sb.from_("classes")
        .select("*")
        .eq("id", session_resp.data["class_id"])
        .eq("teacher_id", profile["id"])
        .single()
        .execute()
    )
    if not class_resp.data:
        return jsonify({"error": "Forbidden: You do not own this class"}), 403

    allowed_keys = ("title", "description", "session_date", "start_time", "end_time", "meet_link")
    update_data = {k: data[k] for k in allowed_keys if k in data}

    result_resp = (
        sb.from_("sessions")
        .update(update_data)
        .eq("id", session_id)
        .select("*, classes(name, subject)")
        .single()
        .execute()
    )
    return jsonify({"session": result_resp.data})


@bp.route("/<string:session_id>", methods=["DELETE"])
@teacher_required
def delete_session(session_id):
    profile = g.profile
    sb = g.sb

    session_resp = sb.from_("sessions").select("*").eq("id", session_id).single().execute()
    if not session_resp.data:
        return jsonify({"error": "Session not found"}), 404

    class_resp = (
        sb.from_("classes")
        .select("*")
        .eq("id", session_resp.data["class_id"])
        .eq("teacher_id", profile["id"])
        .single()
        .execute()
    )
    if not class_resp.data:
        return jsonify({"error": "Forbidden: You do not own this class"}), 403

    sb.from_("sessions").delete().eq("id", session_id).execute()
    return jsonify({"message": "Session deleted"}), 200


sessions_bp = bp