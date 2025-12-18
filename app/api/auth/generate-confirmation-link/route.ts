import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Use Supabase Admin API to generate confirmation link
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: "Supabase configuration missing" },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Generate confirmation link for the user
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "signup",
      email: email,
      options: {
        redirectTo: `${
          process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
        }/auth/activate`,
      },
    });

    if (error) {
      console.error("Error generating confirmation link:", error);
      return NextResponse.json(
        { error: error.message || "Failed to generate confirmation link" },
        { status: 500 }
      );
    }

    // The generateLink response contains properties with the link and token
    // Extract token_hash from the URL or properties
    let tokenHash: string | null = null;
    let confirmationLink: string | null = null;

    if (data.properties?.action_link) {
      confirmationLink = data.properties.action_link;
      // Extract token_hash from the link
      const url = new URL(confirmationLink);
      tokenHash = url.searchParams.get("token_hash");
    }

    // Fallback: try to extract from properties directly
    if (!tokenHash) {
      tokenHash =
        data.properties?.token_hash || data.properties?.hashed_token || null;
    }

    // If we still don't have a token, construct the link from the response
    if (!confirmationLink && tokenHash) {
      confirmationLink = `${
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
      }/auth/activate?token_hash=${tokenHash}&type=signup`;
    }

    if (!tokenHash) {
      console.error("Failed to extract token from response:", data);
      return NextResponse.json(
        { error: "Failed to extract confirmation token" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      confirmationToken: tokenHash,
      confirmationLink:
        confirmationLink ||
        `${
          process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
        }/auth/activate?token_hash=${tokenHash}&type=signup`,
    });
  } catch (error: any) {
    console.error("Error in generate-confirmation-link:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate confirmation link" },
      { status: 500 }
    );
  }
}
