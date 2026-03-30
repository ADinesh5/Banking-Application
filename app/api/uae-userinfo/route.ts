import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    // ✅ Get Authorization header
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Invalid or missing Authorization header" },
        { status: 401 }
      );
    }

    // ✅ Use env base URL
    const baseUrl = process.env.UAE_BASE_URL!;

    // ✅ Call UAE API
    const response = await fetch(
      `${baseUrl}/idp/api/UserInfo/userinfo`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        cache: "no-store", // prevent caching sensitive data
      }
    );

    const data = await response.json();

    // ✅ Handle unauthorized
    if (response.status === 401) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // ✅ Handle API errors
    if (!response.ok) {
      return NextResponse.json(
        {
          error: data?.message || "Failed to fetch user info",
        },
        { status: response.status }
      );
    }

    // ✅ Success
    return NextResponse.json(data);

  } catch (error) {
    console.error("UserInfo API Error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}