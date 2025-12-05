import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://wnagpnsglavajtnfkskb.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduYWdwbnNnbGF2YWp0bmZrc2tiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MDM5NDcsImV4cCI6MjA4MDM3OTk0N30.VG4hxQ_WBVDNex5htcD4iEms0-C7OnGXnR6Vx8lBCXU";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
