from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from flask import Flask

def register_routes(app: "Flask") -> None:
    from .auth import auth_bp
    from .classes import classes_bp
    from .students import students_bp
    from .sessions import sessions_bp
    from .materials import materials_bp
    from .assignments import assignments_bp
    from .submissions import submissions_bp
    from .attendance import attendance_bp
    from .announcements import announcements_bp

    for bp in [
        auth_bp, classes_bp, students_bp, sessions_bp,
        materials_bp, assignments_bp, submissions_bp,
        attendance_bp, announcements_bp,
    ]:
        app.register_blueprint(bp)
