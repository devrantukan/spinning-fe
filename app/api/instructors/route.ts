import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const TENANT_BE_URL = process.env.TENANT_ADMIN_URL || "http://localhost:3001";

export async function GET() {
  try {
    const organizationId =
      process.env.ORGANIZATION_ID || process.env.TENANT_ORGANIZATION_ID;
    
    const instructorsUrl = new URL(`${TENANT_BE_URL}/api/instructors`);
    if (organizationId) {
      instructorsUrl.searchParams.append("organizationId", organizationId);
    }

    console.log(`[FRONTEND-API] Fetching instructors from: ${instructorsUrl.toString()}`);

    const response = await fetch(instructorsUrl.toString(), {
      headers: {
        "Content-Type": "application/json",
        ...(organizationId ? { "X-Organization-Id": organizationId } : {}),
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) {
        console.log(`[FRONTEND-API] Successfully fetched ${data.length} instructors`);
        
        // Map backend fields to frontend fields
        const mappedData = data.map((instructor: any) => ({
          id: instructor.id,
          name: instructor.user?.name || instructor.name || "Unknown Instructor",
          role: instructor.role || "Instructor",
          description: instructor.bio || instructor.description || "",
          image: (instructor.photoUrl || instructor.image || "https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=2787&auto=format&fit=crop").replace("/instructorPhotos/", "/InstructorPhotos/"),
        }));

        return NextResponse.json(mappedData);
      }
    } else {
      const errorText = await response.text();
      console.error(`[FRONTEND-API] Backend returned status ${response.status}:`, errorText);
    }

    return NextResponse.json([]);
  } catch (error: unknown) {
    console.error("[FRONTEND-API] Error in instructors API:", error);
    return NextResponse.json([], { status: 200 });
  }
}
