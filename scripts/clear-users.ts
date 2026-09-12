import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || "https://nmlwibvuvqshfhyjocqj.supabase.co";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tbHdpYnZ1dnFzaGZoeWpvY3FqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyMTcwNTAsImV4cCI6MjA1Njc5MzA1MH0.d9o-bYg2_HlA-y9VlS1r_8-g-e8q2_y-8y9y-8y9y-8";

async function clearUsers() {
  console.log("--------------------------------------------------");
  console.log("CalebPrompt — Clear Users Database Utility");
  console.log("--------------------------------------------------");

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
  });

  try {
    // 1. Check existing profiles
    const { data: profiles, error: fetchErr } = await supabase
      .from("profiles")
      .select("user_id, email, username, role");

    if (fetchErr) {
      console.error("Error connecting to Supabase profiles:", fetchErr.message);
      process.exit(1);
    }

    console.log(`Found ${profiles?.length || 0} users in database profiles table.`);

    if (!profiles || profiles.length === 0) {
      console.log("No users found. Database is already clean!");
      process.exit(0);
    }

    // 2. Delete all records from public.profiles
    const { error: deleteErr } = await supabase
      .from("profiles")
      .delete()
      .neq("user_id", "00000000-0000-0000-0000-000000000000");

    if (deleteErr) {
      console.error("Failed to delete profiles:", deleteErr.message);
    } else {
      console.log("Successfully cleared all profiles from public.profiles!");
    }

    // 3. If service role key is available, delete auth.users
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      if (authUsers?.users && authUsers.users.length > 0) {
        for (const u of authUsers.users) {
          await supabase.auth.admin.deleteUser(u.id);
          console.log(`Deleted auth account: ${u.email} (${u.id})`);
        }
      }
    } else {
      console.log(
        "Note: To delete auth accounts from Supabase Auth tab as well, go to Supabase Dashboard -> Authentication -> Users, or provide SUPABASE_SERVICE_ROLE_KEY in .env."
      );
    }

    console.log("--------------------------------------------------");
    console.log("Done! User list has been cleared.");
    console.log("--------------------------------------------------");
  } catch (err: any) {
    console.error("Unexpected error:", err.message);
  }
}

clearUsers();
