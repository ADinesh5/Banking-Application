"use client"

import React, { useState, useEffect, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { CreditCard, ArrowRight, Loader2 } from "lucide-react"
import swal from "sweetalert"

interface EmiratesIdDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (emiratesId: string, capturedImage: string) => void
}

export function EmiratesIdDialog({
  open,
  onClose,
  onSubmit,
}: EmiratesIdDialogProps) {

  const [emiratesId, setEmiratesId] = useState("")
  const [error, setError] = useState("")
  const [showFaceCapture, setShowFaceCapture] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // ==============================
  // ✅ VERIFY USER (SAFE)
  // ==============================
  const handleVerifyId = async () => {
    if (!emiratesId.trim()) {
      setError("Please enter Email / Mobile Number")
      return
    }

    try {
      const payload = {
        userInput: emiratesId,
        type: getInputType(emiratesId),
        clientType: 1,
        ip: "192.168.1.10",
        userAgent: navigator.userAgent,
        typeOfDevice: "Desktop",
      }

      const response = await fetch("/api/uae-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (data?.success && data?.result?.authnToken) {
        localStorage.setItem("authnToken", data.result.authnToken)
        setShowFaceCapture(true)
      } else {
        setError(data?.message || "Verification failed")
      }

    } catch (err) {
      console.error(err)
      setError("Something went wrong")
    }
  }

  // ==============================
  // ✅ CAPTURE + TOKEN FLOW (SAFE)
  // ==============================
  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const video = videoRef.current
    const ctx = canvas.getContext("2d")

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    ctx?.drawImage(video, 0, 0)

    const imageData = canvas.toDataURL("image/jpeg", 0.9)
    const base64Image = imageData.split(",")[1]

    setIsProcessing(true)

    try {
      const authnToken = localStorage.getItem("authnToken")

      // 🔹 Step 1: Face Verify (via backend)
      const authCodeResp = await fetch("/api/uae-face-auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          authnToken,
          authenticationScheme: "FACE",
          authenticationData: base64Image,
          approved: "true",
        }),
      })

      const authCodeData = await authCodeResp.json()

      if (!authCodeData?.success) {
        throw new Error(authCodeData?.message)
      }

      const authCode = authCodeData?.result?.authorizationCode

      // 🔹 Step 2: Token Exchange (via backend)
      const tokenResponse = await fetch("/api/uae-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: authCode }),
      })

      const tokenData = await tokenResponse.json()

      if (!tokenData?.access_token) {
        throw new Error("No access token")
      }

      localStorage.setItem("uaeFaceAccessToken", tokenData.access_token)

      onSubmit(emiratesId, imageData)

    } catch (err: any) {
      console.error(err)

      swal({
        title: "Error",
        text: err?.message || "Verification failed",
        icon: "error",
      })

    } finally {
      setIsProcessing(false)
    }
  }

  // ==============================
  // UTIL
  // ==============================
  const getInputType = (userName: string): number => {
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userName)) return 2
    if (/^\d{10}$/.test(userName)) return 1
    return 5
  }

  // ==============================
  // UI
  // ==============================
  return (
    <Dialog open={open}>
      <DialogContent>

        {!showFaceCapture && (
          <>
            <DialogHeader>
              <DialogTitle>UAEID Login</DialogTitle>
              <DialogDescription>
                Enter Email / Mobile Number
              </DialogDescription>
            </DialogHeader>

            <Input
              value={emiratesId}
              onChange={(e) => setEmiratesId(e.target.value)}
              placeholder="Enter Email / Mobile"
            />

            {error && <p className="text-red-500">{error}</p>}

            <Button onClick={handleVerifyId}>
              Continue <ArrowRight className="ml-2" />
            </Button>
          </>
        )}

        {showFaceCapture && (
          <div className="space-y-4">
            <video ref={videoRef} autoPlay className="w-full rounded" />
            <canvas ref={canvasRef} className="hidden" />

            <Button onClick={capturePhoto} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="animate-spin" /> : "Capture"}
            </Button>
          </div>
        )}

      </DialogContent>
    </Dialog>
  )
}