import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { requestMainBackend } from "@/lib/main-backend-client";

const TENANT_BE_URL = process.env.TENANT_BE_URL || "http://localhost:3001";

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

    // Get session for backend API calls
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.access_token) {
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

    // First, try backend API (if it has credit transactions endpoint)
    try {
      const backendResult = await requestMainBackend(
        `${TENANT_BE_URL}/api/members/${memberId}/credits/transactions`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      // Check if we got data (ignore 404 errors as endpoint may not exist)
      if (
        backendResult.data &&
        Array.isArray(backendResult.data) &&
        backendResult.data.length > 0
      ) {
        // Filter to only show confirmed transactions and manually added credits
        const filtered = backendResult.data.filter((tx: any) => {
          // Check if this is a manually added credit
          const isManualCredit =
            tx.type === "credit" ||
            tx.type === "add" ||
            tx.type === "manual" ||
            (!tx.redemptionId && !tx.redemption_id);

          // Always include manually added credits
          if (isManualCredit) {
            return true;
          }

          // For redemption-based transactions, check status
          const status = tx.status || tx.redemptionStatus;
          // Only include CONFIRMED, ACTIVE, or APPROVED transactions
          return (
            status === "CONFIRMED" ||
            status === "ACTIVE" ||
            status === "APPROVED"
          );
        });
        // Normalize backend transactions to ensure amount field
        const normalizedBackend = filtered.map((tx: any) => {
          const amount =
            tx.amount ||
            tx.creditAmount ||
            tx.credits ||
            tx.value ||
            tx.credit_amount ||
            tx.credit_value ||
            0;
          return {
            ...tx,
            amount: Number(amount) || 0,
            creditAmount: tx.creditAmount || amount,
            credits: tx.credits || amount,
          };
        });

        console.log(
          "Credit history from backend:",
          normalizedBackend.length,
          "confirmed transactions"
        );
        if (normalizedBackend.length > 0) {
          console.log("Sample backend transaction:", normalizedBackend[0]);
          return NextResponse.json(normalizedBackend);
        }
      }
    } catch {
      // Silently continue to Supabase - backend endpoint may not exist
      console.log(
        "Backend credit transactions endpoint not available (404 expected), trying Supabase"
      );
    }

    // Also try fetching from redemptions and convert to transaction format
    // This is a fallback if transactions table doesn't exist but redemptions do
    try {
      const redemptionsResult = await requestMainBackend(
        `${TENANT_BE_URL}/api/members/${memberId}/redemptions`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (
        redemptionsResult.data &&
        Array.isArray(redemptionsResult.data) &&
        redemptionsResult.data.length > 0
      ) {
        // Filter to only confirmed/active redemptions and convert to transaction format
        const confirmedRedemptions = redemptionsResult.data.filter(
          (r: any) =>
            r.status === "CONFIRMED" ||
            r.status === "ACTIVE" ||
            r.status === "APPROVED"
        );

        if (confirmedRedemptions.length > 0) {
          // Convert redemptions to transaction-like format
          const transactionsFromRedemptions = confirmedRedemptions.map(
            (redemption: any) => {
              // Try multiple field names for credits/amount
              const amount =
                redemption.credits ||
                redemption.creditAmount ||
                redemption.amount ||
                redemption.credit_amount ||
                redemption.value ||
                0;
              return {
                id: redemption.id,
                amount: Number(amount) || 0,
                creditAmount: Number(amount) || 0,
                credits: Number(amount) || 0,
                type: "credit",
                description: `Package redemption - ${
                  redemption.packageId || ""
                }`,
                createdAt: redemption.createdAt || redemption.created_at,
                created_at: redemption.createdAt || redemption.created_at,
                status: redemption.status,
              };
            }
          );

          console.log(
            "Credit history from redemptions:",
            transactionsFromRedemptions.length,
            "transactions"
          );
          return NextResponse.json(transactionsFromRedemptions);
        }
      }
    } catch {
      // Silently continue - redemptions endpoint may not have transaction data
      console.log("Could not fetch from redemptions, trying Supabase");
    }

    // Fallback to Supabase: try different table names and column name variations
    // Try credit_transactions with memberId (camelCase)
    // Note: We query transactions directly without joining redemptions since the relationship may not exist
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
      // If Supabase query failed and we already tried backend, return empty array
      // Credit history will be empty until transactions are created by backend
      return NextResponse.json([]);
    }

    // If no data from Supabase, return empty array
    if (!creditHistory || creditHistory.length === 0) {
      console.log("No credit history found in Supabase or backend");
      return NextResponse.json([]);
    }

    // Filter to only show confirmed transactions, including manually added credits
    let filteredHistory = creditHistory;

    // Filter by status field on transaction
    // Include:
    // - CONFIRMED, ACTIVE, or APPROVED transactions
    // - Manually added credits (type: "credit", "add", "manual" or no status/redemption)
    // Exclude only PENDING redemptions
    filteredHistory = filteredHistory.filter((transaction: any) => {
      // Check if this is a manually added credit (not from redemption)
      const isManualCredit =
        transaction.type === "credit" ||
        transaction.type === "add" ||
        transaction.type === "manual" ||
        (!transaction.redemptionId && !transaction.redemption_id);

      // If it's a manually added credit, always include it
      if (isManualCredit) {
        return true;
      }

      // For redemption-based transactions, check status
      const status = transaction.status || transaction.redemptionStatus;

      if (status) {
        // Only include if status is CONFIRMED, ACTIVE, or APPROVED
        // Exclude PENDING transactions from redemptions
        return (
          status === "CONFIRMED" || status === "ACTIVE" || status === "APPROVED"
        );
      }

      // If no status field exists and it's not a manual credit, include it
      // This handles backward compatibility where transactions might not have status
      // If a transaction exists in the system, assume it's been processed/confirmed
      return true;
    });

    // Normalize transaction data - ensure amount field exists
    const normalizedHistory = filteredHistory.map((transaction: any) => {
      // Try to find amount in various possible field names
      const amount =
        transaction.amount ||
        transaction.creditAmount ||
        transaction.credits ||
        transaction.value ||
        transaction.credit_amount ||
        transaction.credit_value ||
        transaction.credit_value_amount ||
        transaction.quantity ||
        0;

      // Return normalized transaction with amount field
      return {
        ...transaction,
        amount: Number(amount) || 0,
        // Keep original fields for backward compatibility
        creditAmount: transaction.creditAmount || amount,
        credits: transaction.credits || amount,
      };
    });

    console.log(
      "Credit history found:",
      creditHistory?.length || 0,
      "transactions (filtered:",
      normalizedHistory.length,
      "confirmed)"
    );
    console.log(
      "Sample transaction:",
      normalizedHistory.length > 0
        ? JSON.stringify(normalizedHistory[0], null, 2)
        : "No transactions"
    );
    return NextResponse.json(normalizedHistory);
  } catch (error) {
    console.error("Error in credits API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
