"use client"

import type React from "react"

interface ProfessionalQRCodeProps {
  value: string
  size?: number
  className?: string
}

const ProfessionalQRCode: React.FC<ProfessionalQRCodeProps> = ({ value, size = 100, className = "" }) => {
  // Generate QR code using QR Server API
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&format=png&ecc=M`

  return (
    <img
      src={qrImageUrl || "/placeholder.svg"}
      alt={`QR Code: ${value}`}
      width={size}
      height={size}
      className={`border border-gray-200 ${className}`}
      style={{ imageRendering: "pixelated" }}
    />
  )
}

export default ProfessionalQRCode
