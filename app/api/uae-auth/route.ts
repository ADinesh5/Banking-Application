import { SignJWT, importPKCS8 } from "jose";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs"; 

console.log("🔥 UAE AUTH FILE LOADED");

export async function GET() {
  try {
    console.log("ENV CHECK:", {
      clientId: process.env.UAE_CLIENT_ID,
      redirectUri: process.env.UAE_REDIRECT_URI,
      baseUrl: process.env.UAE_BASE_URL,
      keyPath: process.env.PRIVATE_KEY_PATH,
    });

    const clientId = process.env.UAE_CLIENT_ID!;
    const redirectUri = process.env.UAE_REDIRECT_URI!;
    const baseUrl = process.env.UAE_BASE_URL!;
    const scopes = "uaeid:idp:basic:profile";

    if (!clientId || !redirectUri || !baseUrl) {
      throw new Error("Missing env variables");
    }

    const state = crypto.randomUUID();
    const nonce = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);

    const payload = {
      iss: clientId,
      aud: `${baseUrl}/idp`,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: scopes,
      nonce,
      state,
      iat: now,
      nbf: now,
      exp: now + 3600,
      jti: crypto.randomUUID(),
    };

    const keyPath = path.join(process.cwd(), process.env.PRIVATE_KEY_PATH!);

    if (!fs.existsSync(keyPath)) {
      throw new Error("Private key file not found");
    }

    const pem = fs.readFileSync(keyPath, "utf8").trim();

    const key = await importPKCS8(pem, "RS256");

    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: "RS256" })
      .sign(key);

    const url = `${baseUrl}/idp/authorization?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=code&scope=${encodeURIComponent(
      scopes
    )}&state=${state}&nonce=${nonce}&request=${token}`;

    return NextResponse.json({ url });

  } catch (error) {
    console.error("🔥 UAE AUTH ERROR:", error);

    return NextResponse.json(
      { error: "Failed to generate auth URL" },
      { status: 500 }
    );
  }
}