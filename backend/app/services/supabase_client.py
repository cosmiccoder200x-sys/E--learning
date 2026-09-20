import os

# Add the project root to the path so the app can find the supabase client
from supabase import Client, create_client

def get_supabase() -> Client:
    return create_client(
        os.getenv("VITE_SUPABASE_URL"),
        os.getenv("SUPABASE_SERVICE_ROLE_KEY"),
    )
