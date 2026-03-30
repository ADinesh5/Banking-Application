import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // ✅ Validate required fields (basic)
    if (!body?.userInput || !body?.type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // ✅ Read env variables
    const baseUrl = process.env.UAE_BASE_URL!;
    const clientId = process.env.UAE_CLIENT_ID!;

    // ✅ Call UAE VerifyUser API
    const response = await fetch(
      `${baseUrl}/idp/api/SDKLogin/VerifyUser`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...body,
          clientId, // injected securely
        }),
      }
    );

    const data = await response.json();

    // Handle API errors
    if (!response.ok) {
      return NextResponse.json(
        {
          error: data?.message || "Verification failed",
        },
        { status: response.status }
      );
    }

    //  Success
    return NextResponse.json(data);

  } catch (error) {
    console.error("Verify API Error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}