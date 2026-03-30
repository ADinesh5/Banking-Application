import { NextResponse } from "next/server";

export async function GET() {
  const logoutUrl = process.env.UAE_IDP_LOGOUT_URL!;
  const redirectUri = process.env.UAE_IDP_REDIRECT_URI!;

  const fullLogoutUrl = `${logoutUrl}?redirect_uri=${encodeURIComponent(redirectUri)}`;

  return NextResponse.redirect(fullLogoutUrl);
}