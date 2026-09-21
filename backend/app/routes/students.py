from flask import Blueprint, jsonify, g
from app.utils.auth import (
    teacher_required,
)

bp = Blueprint("students", __name__, url_prefix="/api/students")


@bp.route("", methods=["GET"])
@teacher_required
def get_students():
    sb = g.sb
    students_resp = (
        sb.from_("profiles")
        .select("id, name, email, avatar_url, created_at")
        .eq("role", "student")
        .order("name")
        .execute()
    )
    return jsonify({"students": students_resp.data if students_resp.data else []})


@bp.route("/<string:student_id>", methods=["GET"])
@teacher_required
def get_student(student_id):
    sb = g.sb
    student_resp = (
        sb.from_("profiles")
        .select("id, name, email, avatar_url, created_at")
        .eq("id", student_id)
        .single()
        .execute()
    )
    if not student_resp.data:
        return jsonify({"error": "Student not found"}), 404
    return jsonify({"student": student_resp.data})


students_bp = bp