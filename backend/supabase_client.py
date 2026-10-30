"""
PulseGrid V2 - Supabase Client Bridge
Supports real-time synchronization with Supabase when configured,
with graceful seamless fallback to the local operational database.
"""

import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY", "")

class SupabaseBridge:
    def __init__(self):
        self.is_configured = bool(SUPABASE_URL and SUPABASE_KEY and not SUPABASE_URL.startswith("your_"))
        self.client = None

        if self.is_configured:
            try:
                from supabase import create_client
                self.client = create_client(SUPABASE_URL, SUPABASE_KEY)
                print(f"Supabase Bridge connected to: {SUPABASE_URL}")
            except Exception as e:
                print(f"Supabase Client init notice (using local operational store): {e}")
                self.is_configured = False

    def sync_event(self, event_data: dict):
        if self.is_configured and self.client:
            try:
                self.client.table("operational_events").insert(event_data).execute()
            except Exception as e:
                print(f"Supabase async event sync note: {e}")

supabase_bridge = SupabaseBridge()

