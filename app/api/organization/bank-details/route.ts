import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface BankDetails {
  accountName: string;
  bankName: string;
  accountNumber: string;
  iban?: string;
  swift?: string;
  branchCode?: string;
  currency?: string;
  notes?: string;
}

// GET - Retrieve bank details (public, needed for payment instructions)
export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("organization_settings")
      .select("bank_details")
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 means no rows returned, which is okay
      console.error("Error fetching bank details:", error);
      return NextResponse.json(
        { error: "Failed to fetch bank details" },
        { status: 500 }
      );
    }

    const bankDetails = data?.bank_details || null;

    return NextResponse.json({ bankDetails });
  } catch (error: any) {
    console.error("Error in bank details API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST/PUT - Update bank details (admin only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin (you may need to adjust this based on your auth setup)
    // For now, we'll allow if authenticated - you can add admin check later
    const body: { bankDetails: BankDetails } = await request.json();

    // Validate bank details
    if (
      !body.bankDetails?.accountName ||
      !body.bankDetails?.bankName ||
      !body.bankDetails?.accountNumber
    ) {
      return NextResponse.json(
        { error: "Missing required bank details" },
        { status: 400 }
      );
    }

    // Upsert organization settings
    const { data, error } = await supabase
      .from("organization_settings")
      .upsert(
        {
          id: 1, // Single organization settings record
          bank_details: body.bankDetails,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      )
      .select()
      .single();

    if (error) {
      console.error("Error updating bank details:", error);

      // If table doesn't exist, provide SQL to create it
      if (error.code === "42P01") {
        return NextResponse.json(
          {
            error: "Database table not found",
            message: "The organization_settings table needs to be created.",
            sql: `
-- Create organization_settings table
CREATE TABLE IF NOT EXISTS organization_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  bank_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on id
CREATE UNIQUE INDEX IF NOT EXISTS organization_settings_id_idx ON organization_settings(id);
            `.trim(),
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { error: "Failed to update bank details", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ bankDetails: data.bank_details });
  } catch (error: any) {
    console.error("Error in bank details API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
