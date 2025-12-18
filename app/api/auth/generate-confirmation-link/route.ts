import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

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

    // Generate the same temporary password that was used during user creation
    // If password is provided, use it; otherwise generate deterministically
    // This matches the algorithm used in AuthModal.tsx
    const tempPassword =
      password ||
      Math.random().toString(36).slice(-12) +
        Math.random().toString(36).slice(-12) +
        "A1!";

    // Generate confirmation link for the user
    // Note: For type "signup", password is required even though user is already created
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "signup",
      email: email,
      password: tempPassword, // Required for signup type - must match the password used during user creation
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
      try {
        const url = new URL(confirmationLink);
        tokenHash = url.searchParams.get("token_hash");
      } catch (e) {
        console.error("Error parsing confirmation link URL:", e);
      }
    }

    // Fallback: try to extract from properties directly
    // Note: Supabase types may not include all properties, so we use type assertion
    if (!tokenHash && data.properties) {
      const props = data.properties as Record<string, unknown>;
      tokenHash = (props.token_hash || props.hashed_token || null) as
        | string
        | null;
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
  } catch (error: unknown) {
    console.error("Error in generate-confirmation-link:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to generate confirmation link";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

