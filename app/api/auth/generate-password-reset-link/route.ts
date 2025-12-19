import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Use Supabase Admin API to generate password reset link
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

    // Generate password reset link for the user
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: email,
      options: {
        redirectTo: `${
          process.env.TENANT_FE_URL ||
          process.env.NEXT_PUBLIC_SITE_URL ||
          "http://localhost:3000"
        }/auth/reset-password`,
      },
    });

    if (error) {
      console.error("Error generating password reset link:", error);
      return NextResponse.json(
        { error: error.message || "Failed to generate password reset link" },
        { status: 500 }
      );
    }

    // The generateLink response contains properties with the link and token
    // Extract token_hash from the URL or properties
    let tokenHash: string | null = null;
    let resetLink: string | null = null;

    if (data.properties?.action_link) {
      resetLink = data.properties.action_link;
      // Extract token_hash from the link
      try {
        const url = new URL(resetLink);
        tokenHash = url.searchParams.get("token_hash");
      } catch (e) {
        console.error("Error parsing password reset link URL:", e);
      }
    }

    // Fallback: try to extract from properties directly
    if (!tokenHash && data.properties) {
      const props = data.properties as Record<string, unknown>;
      tokenHash = (props.token_hash || props.hashed_token || null) as
        | string
        | null;
    }

    // If we still don't have a token, construct the link from the response
    if (!resetLink && tokenHash) {
      const baseUrl =
        process.env.TENANT_FE_URL ||
        process.env.NEXT_PUBLIC_SITE_URL ||
        "http://localhost:3000";
      resetLink = `${baseUrl}/auth/reset-password?token_hash=${tokenHash}&type=recovery`;
    }

    if (!tokenHash) {
      console.error("Failed to extract token from response:", data);
      return NextResponse.json(
        { error: "Failed to extract password reset token" },
        { status: 500 }
      );
    }

    const baseUrl =
      process.env.TENANT_FE_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000";
    return NextResponse.json({
      resetToken: tokenHash,
      resetLink:
        resetLink ||
        `${baseUrl}/auth/reset-password?token_hash=${tokenHash}&type=recovery`,
    });
  } catch (error: unknown) {
    console.error("Error in generate-password-reset-link:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to generate password reset link";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
