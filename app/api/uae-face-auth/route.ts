import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      authnToken,
      authenticationScheme,
      authenticationData,
      approved,
    } = body;

    if (!authnToken || !authenticationData) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const baseUrl = process.env.UAE_BASE_URL!;

    // ✅ Use env base URL
    const response = await fetch(
      `${baseUrl}/idp/api/SDKLogin/VerifyUserAuthData`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          authnToken,
          authenticationScheme: authenticationScheme || "FACE",
          authenticationData,
          approved: approved || "true",

          // Optional (keep if required)
          randomCode: "482915",
          documentNumber: "A123456789",
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.message || "Face auth failed" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error("Face Auth Error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}