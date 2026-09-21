import os
from functools import wraps
from typing import Optional, Tuple, Dict, Any
from flask import request, jsonify, g
from supabase import Client, create_client

_supabase_client: Optional[Client] = None

def get_supabase() -> Client:
    """Return a singleton Supabase client using service role key."""
    global _supabase_client
    url = os.getenv("VITE_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        # Fallback for dev/initialization without env
        url = url or "https://placeholder.supabase.co"
        key = key or "placeholder-key"
    if _supabase_client is None:
        _supabase_client = create_client(url, key)
    return _supabase_client


def get_profile_by_auth_id(sb: Client, auth_user_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve profile row by auth_user_id."""
    try:
        resp = sb.from_("profiles").select("*").eq("auth_user_id", auth_user_id).single().execute()
        return resp.data if resp.data else None
    except Exception:
        return None


def get_profile_by_email(sb: Client, email: str) -> Optional[Dict[str, Any]]:
    """Retrieve profile row by email."""
    try:
        resp = sb.from_("profiles").select("*").eq("email", email).single().execute()
        return resp.data if resp.data else None
    except Exception:
        return None


def get_auth_context(req) -> Tuple[Optional[Any], Optional[Dict[str, Any]], Optional[Client]]:
    """
    Extract Bearer token from request headers, authenticate with Supabase,
    and fetch the associated profile row.
    Returns (user, profile, sb).
    """
    auth_header = req.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "").strip() if auth_header.startswith("Bearer ") else ""
    if not token:
        return None, None, None

    sb = get_supabase()
    try:
        response = sb.auth.get_user(token)
        user = response.user if response and response.user else None
        if not user:
            return None, None, None

        profile = get_profile_by_auth_id(sb, user.id)
        return user, profile, sb
    except Exception:
        return None, None, None


def auth_required(fn):
    """Decorator ensuring a valid authenticated user and existing profile."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        user, profile, sb = get_auth_context(request)
        if not user or not profile:
            return jsonify({"error": "Unauthorized or profile missing"}), 401
        g.user = user
        g.profile = profile
        g.sb = sb
        return fn(*args, **kwargs)
    return wrapper


def teacher_required(fn):
    """Decorator ensuring authenticated user has role 'teacher' or 'admin'."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        user, profile, sb = get_auth_context(request)
        if not user or not profile:
            return jsonify({"error": "Unauthorized"}), 401
        if profile.get("role") not in ("teacher", "admin"):
            return jsonify({"error": "Forbidden: Teacher access required"}), 403
        g.user = user
        g.profile = profile
        g.sb = sb
        return fn(*args, **kwargs)
    return wrapper


def student_required(fn):
    """Decorator ensuring authenticated user has role 'student'."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        user, profile, sb = get_auth_context(request)
        if not user or not profile:
            return jsonify({"error": "Unauthorized"}), 401
        if profile.get("role") != "student":
            return jsonify({"error": "Forbidden: Student access required"}), 403
        g.user = user
        g.profile = profile
        g.sb = sb
        return fn(*args, **kwargs)
    return wrapper
