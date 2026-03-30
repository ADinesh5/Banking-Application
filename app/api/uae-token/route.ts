import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { code } = await req.json();

    // ✅ Validate input
    if (!code) {
      return NextResponse.json(
        { error: "Missing authorization code" },
        { status: 400 }
      );
    }

    // ✅ Read env variables
    const baseUrl = process.env.UAE_BASE_URL!;
    const clientId = process.env.UAE_CLIENT_ID!;
    const redirectUri = process.env.UAE_REDIRECT_URI!;
    const basicAuth = process.env.UAE_BASIC_AUTH!;

    // ✅ Call UAE token API
    const response = await fetch(
      `${baseUrl}/idp/api/Authentication/token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: basicAuth,
        },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      }
    );

    const data = await response.json();

    // ✅ Handle API errors properly
    if (!response.ok) {
      return NextResponse.json(
        {
          error: data?.message || "Token exchange failed",
        },
        { status: response.status }
      );
    }

    // ✅ Success
    return NextResponse.json(data);

  } catch (error) {
    console.error("Token API Error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}