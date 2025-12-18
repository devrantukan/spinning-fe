import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Await params in Next.js 15
    const { id } = await params;
    const memberId = id;

    // Use authenticated user's session client
    const queryClient = supabase;

    console.log("Fetching credit history for member:", memberId);

    // First, get the user record from users table using supabaseUserId
    const { data: userRecord, error: userError } = await queryClient
      .from("users")
      .select("id, supabaseUserId")
      .eq("supabaseUserId", user.id)
      .single();

    if (userError || !userRecord) {
      console.error("Error fetching user from users table:", userError);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify the member belongs to the current user
    // Check by userId which references users.id
    const { data: member, error: memberError } = await queryClient
      .from("members")
      .select("id, userId")
      .eq("id", memberId)
      .eq("userId", userRecord.id)
      .single();

    if (memberError || !member) {
      console.error("Member verification error:", memberError);
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Fetch credit history - try different table names and column name variations
    let creditHistory: any = null;
    let historyError: any = null;

    console.log("Attempting to fetch credit history for member:", memberId);

    // Try credit_transactions with memberId (camelCase)
    const result1 = await queryClient
      .from("credit_transactions")
      .select("*")
      .eq("memberId", memberId)
      .order("createdAt", { ascending: false })
      .limit(50);

    console.log("Result 1 (credit_transactions, memberId):", {
      data: result1.data,
      error: result1.error,
      count: result1.data?.length || 0,
    });

    creditHistory = result1.data;
    historyError = result1.error;

    // If that fails, try with member_id (snake_case)
    if (historyError && historyError.code === "42703") {
      console.log("Trying with member_id instead of memberId");
      const result2 = await queryClient
        .from("credit_transactions")
        .select("*")
        .eq("member_id", memberId)
        .order("created_at", { ascending: false })
        .limit(50);

      console.log("Result 2 (credit_transactions, member_id):", {
        data: result2.data,
        error: result2.error,
        count: result2.data?.length || 0,
      });

      creditHistory = result2.data;
      historyError = result2.error;
    }

    // If credit_transactions doesn't exist, try transactions table
    if (historyError && historyError.code === "42P01") {
      console.log("Trying transactions table");
      const result3 = await queryClient
        .from("transactions")
        .select("*")
        .eq("memberId", memberId)
        .order("createdAt", { ascending: false })
        .limit(50);

      console.log("Result 3 (transactions, memberId):", {
        data: result3.data,
        error: result3.error,
        count: result3.data?.length || 0,
      });

      creditHistory = result3.data;
      historyError = result3.error;

      if (historyError && historyError.code === "42703") {
        const result4 = await queryClient
          .from("transactions")
          .select("*")
          .eq("member_id", memberId)
          .order("created_at", { ascending: false })
          .limit(50);

        console.log("Result 4 (transactions, member_id):", {
          data: result4.data,
          error: result4.error,
          count: result4.data?.length || 0,
        });

        creditHistory = result4.data;
        historyError = result4.error;
      }
    }

    // Handle permission errors
    if (historyError && historyError.code === "42501") {
      console.error("Permission denied for credit history:", historyError);
      return NextResponse.json(
        {
          error: "Permission denied",
          message:
            "RLS (Row Level Security) policies need to be configured for credit_transactions table.",
          sql: `
-- Grant permissions
GRANT SELECT ON TABLE credit_transactions TO anon, authenticated;

-- Enable RLS
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Create policy (adjust column names as needed)
DROP POLICY IF EXISTS "Users can read own credit transactions" ON credit_transactions;
CREATE POLICY "Users can read own credit transactions"
ON credit_transactions FOR SELECT
USING (
  "memberId" IN (
    SELECT m.id FROM members m
    JOIN users u ON m."userId" = u.id
    WHERE u."supabaseUserId"::text = auth.uid()::text
  )
);
          `.trim(),
        },
        { status: 403 }
      );
    }

    if (historyError) {
      console.error("Error fetching credit history:", historyError);
      console.error("Error code:", historyError.code);
      console.error("Error message:", historyError.message);
      // Return empty array if there's an error (table might not exist or have data)
      return NextResponse.json([]);
    }

    console.log(
      "Credit history found:",
      creditHistory?.length || 0,
      "transactions"
    );
    console.log("Credit history data:", JSON.stringify(creditHistory, null, 2));
    return NextResponse.json(creditHistory || []);
  } catch (error) {
    console.error("Error in credits API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
