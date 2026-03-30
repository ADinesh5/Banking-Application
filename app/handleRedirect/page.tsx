"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function HandleRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        const url = new URL(window.location.href)
        const authCode = url.searchParams.get("code")

        if (!authCode) {
          console.error("No authorization code found")
          return
        }

        // Call backend instead of UAE directly
        const tokenResponse = await fetch("/api/uae-token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code: authCode }),
        })

        if (!tokenResponse.ok) {
          throw new Error("Token exchange failed")
        }

        const tokenData = await tokenResponse.json()

        const accessToken = tokenData?.access_token
        const idToken = tokenData?.id_token

        if (!accessToken) {
          throw new Error("No access token received")
        }

        //Store tokens
        localStorage.setItem("uaeFaceAccessToken", accessToken)

        if (idToken) {
          localStorage.setItem("uaeFaceIdToken", idToken)
        }

        // Cleanup login flag
        localStorage.removeItem("loginInitiated")

        // Optional: auto-expiry cleanup (1 hour)
        setTimeout(() => {
          localStorage.removeItem("uaeFaceAccessToken")
          localStorage.removeItem("uaeFaceIdToken")
        }, 60 * 60 * 1000)

        // ✅ Redirect handling
        if (window.opener) {
          window.opener.location.href = "/"
          window.close()
        } else {
          router.replace("/")
        }

      } catch (err) {
        console.error("Error exchanging code:", err)
      }
    }

    handleRedirect()
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-white rounded-full animate-spin"></div>
    </div>
  )
}