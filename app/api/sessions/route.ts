import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const TENANT_BE_URL = process.env.TENANT_BE_URL || "http://localhost:3001";

export async function GET(request: NextRequest) {
  try {
    // Get Supabase session to extract auth token
    const supabase = await createClient();
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.access_token) {
      console.log(
        "No session or access token available:",
        sessionError?.message
      );
      // Return empty array if not authenticated (UI can still render)
      return NextResponse.json([], { status: 200 });
    }

    const { searchParams } = new URL(request.url);
    const instructor = searchParams.get("instructor");
    const workoutType = searchParams.get("workoutType");
    const search = searchParams.get("search");
    const timeFilter = searchParams.get("timeFilter"); // 'all', 'am', 'pm'
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build query parameters for the backend
    const queryParams = new URLSearchParams();
    if (instructor) queryParams.append("instructor", instructor);
    if (workoutType) queryParams.append("workoutType", workoutType);
    if (search) queryParams.append("search", search);
    if (timeFilter) queryParams.append("timeFilter", timeFilter);
    if (startDate) queryParams.append("startDate", startDate);
    if (endDate) queryParams.append("endDate", endDate);

    // The spinning-tenant-be API endpoint is /api/sessions
    const endpoint = `${TENANT_BE_URL}/api/sessions`;
    const queryString = queryParams.toString()
      ? `?${queryParams.toString()}`
      : "";
    const url = `${endpoint}${queryString}`;

    console.log("Fetching sessions from:", url);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        // Handle different response formats
        let sessions = [];
        if (Array.isArray(data)) {
          sessions = data;
        } else if (data && Array.isArray(data.sessions)) {
          sessions = data.sessions;
        } else if (data && Array.isArray(data.data)) {
          sessions = data.data;
        }

        console.log(
          `Successfully fetched ${sessions.length} sessions from ${endpoint}`
        );
        return NextResponse.json(sessions);
      } else {
        // Log error but return empty array
        const errorText = await response.text();
        console.error(
          `Error fetching sessions: ${response.status} ${response.statusText}`,
          errorText.substring(0, 200)
        );
        return NextResponse.json([], { status: 200 });
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error(`Failed to fetch from ${endpoint}:`, error.message);
      // Return empty array on error so the UI can still render
      return NextResponse.json([], { status: 200 });
    }
  } catch (error) {
    console.error("Error in sessions API:", error);
    // Return empty array on error so the UI can still render
    return NextResponse.json([], { status: 200 });
  }
}




