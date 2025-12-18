import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse, NextRequest } from "next/server";

const TENANT_BE_URL = process.env.TENANT_ADMIN_URL || "http://localhost:3001";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use the authenticated user's session client
    // This will respect RLS policies, which should allow users to read their own data
    const queryClient = supabase;

    console.log("Using authenticated user client with RLS");
    console.log("Supabase auth user ID:", user.id);
    console.log("User object:", { id: user.id, email: user.email });

    // First, get the user record from users table using supabaseUserId
    const { data: userRecord, error: userError } = await queryClient
      .from("users")
      .select("id, supabaseUserId")
      .eq("supabaseUserId", user.id)
      .single();

    if (userError || !userRecord) {
      console.error("Error fetching user from users table:", userError);

      // Permission denied error - need RLS policies for users table
      if (userError?.code === "42501") {
        return NextResponse.json(
          {
            error: "Permission denied",
            message:
              "RLS (Row Level Security) policies need to be configured for the users table. Run this complete SQL script in your Supabase SQL Editor:",
            sql: `
-- Step 1: Grant schema usage permission to anon and authenticated roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON SCHEMA public TO anon, authenticated;

-- Step 2: Grant table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE users TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE members TO anon, authenticated;

-- Step 3: Enable RLS on both tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own user data" ON users;
DROP POLICY IF EXISTS "Users can read own member data" ON members;

-- Step 5: Create policy for users table
CREATE POLICY "Users can read own user data"
ON users FOR SELECT
USING (auth.uid()::text = "supabaseUserId"::text);

-- Step 6: Create policy for members table (userId references users.id)
CREATE POLICY "Users can read own member data"
ON members FOR SELECT
USING (
  "userId" IN (
    SELECT id FROM users WHERE "supabaseUserId"::text = auth.uid()::text
  )
);

-- Step 7: Verify the policies were created
-- SELECT * FROM pg_policies WHERE tablename IN ('users', 'members');
            `.trim(),
            code: userError.code,
            troubleshooting:
              "If this still doesn't work, check: 1) Column name matches (supabaseUserId), 2) RLS is enabled on the users table, 3) The policy appears in pg_policies",
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        {
          error: "User not found in users table",
          details: userError?.message,
          code: userError?.code,
        },
        { status: 404 }
      );
    }

    console.log("Found user record:", userRecord);
    console.log("User ID from users table:", userRecord.id);

    // Now query members table using the userId from users table
    const { data: members, error } = await queryClient
      .from("members")
      .select(
        `
        id,
        userId,
        creditBalance,
        status
      `
      )
      .eq("userId", userRecord.id);

    console.log("Query result:", {
      membersCount: members?.length || 0,
      members: members,
      error: error,
    });

    if (error) {
      console.error("Error fetching members:", error);
      console.error("User ID:", user.id);
      console.error("Full error object:", JSON.stringify(error, null, 2));

      // Permission denied error - need RLS policies
      if (error.code === "42501") {
        return NextResponse.json(
          {
            error: "Permission denied",
            message:
              "RLS (Row Level Security) policies need to be configured. Run this complete SQL script in your Supabase SQL Editor:",
            sql: `
-- Step 1: Grant schema usage permission to anon and authenticated roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON SCHEMA public TO anon, authenticated;

-- Step 2: Grant table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE users TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE members TO anon, authenticated;

-- Step 3: Enable RLS on both tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own user data" ON users;
DROP POLICY IF EXISTS "Users can read own member data" ON members;

-- Step 5: Create policy for users table
CREATE POLICY "Users can read own user data"
ON users FOR SELECT
USING (auth.uid()::text = "supabaseUserId"::text);

-- Step 6: Create policy for members table (userId references users.id)
CREATE POLICY "Users can read own member data"
ON members FOR SELECT
USING (
  "userId" IN (
    SELECT id FROM users WHERE "supabaseUserId"::text = auth.uid()::text
  )
);

-- Step 7: Verify the policies were created
-- SELECT * FROM pg_policies WHERE tablename IN ('users', 'members');
            `.trim(),
            code: error.code,
            troubleshooting:
              "If this still doesn't work, check: 1) Column name matches (userId vs user_id), 2) RLS is enabled on the table, 3) The policy appears in pg_policies",
          },
          { status: 403 }
        );
      }
      return NextResponse.json(
        {
          error: "Failed to fetch members",
          details: error.message,
          code: error.code,
        },
        { status: 500 }
      );
    }

    // Log the raw data for debugging
    console.log("Raw members data:", JSON.stringify(members, null, 2));

    // Transform the data to ensure creditBalance is properly set
    const transformedMembers = Array.isArray(members)
      ? members.map((member: any) => {
          const creditBalance =
            member.creditBalance !== undefined && member.creditBalance !== null
              ? Number(member.creditBalance)
              : 0;

          console.log("Member:", {
            id: member.id,
            userId: member.userId,
            creditBalance: member.creditBalance,
            creditBalanceType: typeof member.creditBalance,
            transformedCreditBalance: creditBalance,
          });

          return {
            ...member,
            creditBalance,
          };
        })
      : [];

    console.log(
      "Transformed members:",
      JSON.stringify(transformedMembers, null, 2)
    );

    return NextResponse.json(transformedMembers);
  } catch (error) {
    console.error("Error in members API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { supabaseUserId, role = "member" } = body;

    if (!supabaseUserId) {
      return NextResponse.json(
        { error: "supabaseUserId is required" },
        { status: 400 }
      );
    }

    // Use service role client to create member (bypasses RLS)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: "Supabase configuration missing" },
        { status: 500 }
      );
    }

    const supabaseAdmin = createServiceClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // First, get the user record from users table
    // If it doesn't exist, try to create it
    let { data: userRecord, error: userError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("supabaseUserId", supabaseUserId)
      .single();

    if (userError || !userRecord) {
      console.log(
        "User record not found - it will be created when TOC is saved"
      );
      // User record doesn't exist yet - it will be created when TOC is saved
      // Return success but indicate that member creation will happen later
      return NextResponse.json(
        {
          message:
            "User record not found yet. Member will be created after user record is created.",
          details:
            "User record will be created when TOC is accepted. Please retry member creation after that.",
          retry: true,
        },
        { status: 200 } // Return 200 so registration doesn't fail
      );
    }

    // Check if member already exists
    const { data: existingMember, error: checkError } = await supabaseAdmin
      .from("members")
      .select("id")
      .eq("userId", userRecord.id)
      .single();

    if (existingMember) {
      // Member already exists, return it
      return NextResponse.json(
        { message: "Member already exists", member: existingMember },
        { status: 200 }
      );
    }

    // Create member record
    const { data: member, error: memberError } = await supabaseAdmin
      .from("members")
      .insert({
        userId: userRecord.id,
        role: role,
        creditBalance: 0,
        status: "active",
      })
      .select()
      .single();

    if (memberError) {
      console.error("Error creating member:", memberError);
      return NextResponse.json(
        { error: "Failed to create member", details: memberError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(member, { status: 201 });
  } catch (error: any) {
    console.error("Error in POST members API:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
