from flask import Blueprint, request, jsonify, g
from datetime import datetime, timezone
from app.utils.auth import (
    auth_required,
    teacher_required,
)

bp = Blueprint("attendance", __name__, url_prefix="/api/attendance")


@bp.route("", methods=["GET"])
@teacher_required
def get_attendance():
    sb = g.sb
    profile = g.profile
    session_id = request.args.get("session_id")
    class_id = request.args.get("class_id")

    if session_id:
        # Verify session belongs to teacher's class
        session_resp = sb.from_("sessions").select("*, classes(teacher_id)").eq("id", session_id).single().execute()
        if not session_resp.data:
            return jsonify({"error": "Session not found"}), 404
        if session_resp.data.get("classes", {}).get("teacher_id") != profile["id"]:
            return jsonify({"error": "Forbidden"}), 403

        attendance_resp = (
            sb.from_("attendance")
            .select("*, profiles:student_id(id, name, email, avatar_url)")
            .eq("session_id", session_id)
            .execute()
        )
        return jsonify({"attendance": attendance_resp.data if attendance_resp.data else []})

    if class_id:
        sessions_resp = sb.from_("sessions").select("id").eq("class_id", class_id).execute()
        session_ids = [s["id"] for s in sessions_resp.data] if sessions_resp.data else []
        if session_ids:
            attendance_resp = (
                sb.from_("attendance")
                .select("*, profiles:student_id(id, name, email), sessions(title, session_date)")
                .in_("session_id", session_ids)
                .execute()
            )
            return jsonify({"attendance": attendance_resp.data if attendance_resp.data else []})

    return jsonify({"attendance": []})


@bp.route("", methods=["POST"])
@teacher_required
def mark_attendance():
    data = request.get_json() or {}
    session_id = data.get("session_id")
    student_id = data.get("student_id")
    status = data.get("status")

    if not session_id or not student_id or not status:
        return jsonify({"error": "session_id, student_id, and status are required"}), 400

    if status not in ("present", "absent", "late"):
        return jsonify({"error": "Invalid status. Must be 'present', 'absent', or 'late'"}), 400

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

    now_iso = datetime.now(timezone.utc).isoformat()
    result_resp = (
        sb.from_("attendance")
        .upsert({
            "session_id": session_id,
            "student_id": student_id,
            "status": status,
            "marked_at": now_iso,
        }, on_conflict="session_id,student_id")
        .select("*, profiles:student_id(id, name, email)")
        .single()
        .execute()
    )
    return jsonify({"attendance": result_resp.data}), 201


@bp.route("/session/<string:session_id>", methods=["GET"])
@auth_required
def get_session_attendance(session_id):
    profile = g.profile
    sb = g.sb
    role = profile.get("role")

    if role == "student":
        attendance_resp = (
            sb.from_("attendance")
            .select("*, sessions(title, session_date)")
            .eq("student_id", profile["id"])
            .eq("session_id", session_id)
            .execute()
        )
        return jsonify({"attendance": attendance_resp.data if attendance_resp.data else []})

    # For teacher:
    attendance_resp = (
        sb.from_("attendance")
        .select("*, profiles:student_id(id, name, email)")
        .eq("session_id", session_id)
        .execute()
    )
    return jsonify({"attendance": attendance_resp.data if attendance_resp.data else []})


@bp.route("/me", methods=["GET"])
@auth_required
def get_my_attendance():
    profile = g.profile
    sb = g.sb

    if profile.get("role") != "student":
        return jsonify({"error": "Student access only"}), 403

    attendance_resp = (
        sb.from_("attendance")
        .select("*, sessions(id, title, session_date, class_id, classes(name, subject))")
        .eq("student_id", profile["id"])
        .order("marked_at", desc=True)
        .execute()
    )
    return jsonify({"attendance": attendance_resp.data if attendance_resp.data else []})


attendance_bp = bp
