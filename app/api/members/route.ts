import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

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
        status,
        confirmedCreditBalance:creditBalance
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
