"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, CameraOff, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface SimpleQrScannerProps {
  onScan: (result: string) => void;
}

export function SimpleQrScanner({ onScan }: SimpleQrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">(
    "environment"
  );
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up function
  const cleanup = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  // Start the scanner
  const startScanner = async () => {
    try {
      setError(null);
      cleanup();

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play().then(() => {
              setIsScanning(true);
              startBarcodeDetection();
            });
          }
        };
      }
    } catch (err: any) {
      console.error("Error accessing camera:", err);
      setError("Could not access camera. Please check permissions.");
      toast.error("Camera Error", {
        description: "Could not access your camera. Please check permissions.",
      });
    }
  };

  // Stop the scanner
  const stopScanner = () => {
    cleanup();
    setIsScanning(false);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Toggle camera
  const toggleCamera = () => {
    const newFacingMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(newFacingMode);
    if (isScanning) {
      stopScanner();
      setTimeout(startScanner, 300);
    }
  };

  // Barcode detection using native BarcodeDetector API
  const startBarcodeDetection = () => {
    if (!("BarcodeDetector" in window)) {
      // Fallback for browsers without BarcodeDetector
      startManualDetection();
      return;
    }

    const barcodeDetector = new (window as any).BarcodeDetector({
      formats: ["qr_code"],
    });

    const detectQR = async () => {
      if (!isScanning || !videoRef.current || !canvasRef.current) return;

      try {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0);

          const barcodes = await barcodeDetector.detect(canvas);

          if (barcodes.length > 0) {
            const qrCode = barcodes[0];
            console.log("QR Code detected:", qrCode.rawValue);
            onScan(qrCode.rawValue);
            stopScanner();
            toast.success("QR Code Detected", {
              description: "Successfully scanned QR code",
            });
          }
        }
      } catch (err) {
        console.error("QR detection error:", err);
      }
    };

    scanIntervalRef.current = setInterval(detectQR, 500);
  };

  // Manual detection fallback
  const startManualDetection = () => {
    toast.info("Manual Mode", {
      description: "QR detection running in compatibility mode",
    });

    const detectManually = () => {
      if (!isScanning || !videoRef.current || !canvasRef.current) return;

      try {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0);

          // Draw scanning line for visual feedback
          const scanLineY = ((Date.now() % 2000) / 2000) * canvas.height;
          ctx.strokeStyle = "#66DE16";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(0, scanLineY);
          ctx.lineTo(canvas.width, scanLineY);
          ctx.stroke();
        }
      } catch (err) {
        console.error("Manual detection error:", err);
      }
    };

    scanIntervalRef.current = setInterval(detectManually, 100);
  };

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, []);

  return (
    <Card className="overflow-hidden">
      <div className="p-4 flex justify-between items-center border-b">
        <h3 className="font-medium">QR Code Scanner</h3>
        <div className="flex gap-2">
          {isScanning ? (
            <Button variant="outline" size="sm" onClick={stopScanner}>
              <CameraOff className="h-4 w-4 mr-1" />
              Stop
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={startScanner}>
              <Camera className="h-4 w-4 mr-1" />
              Start
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={toggleCamera}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Flip
          </Button>
        </div>
      </div>

      <div className="relative">
        <div className="w-full aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
          {isScanning ? (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full object-cover opacity-50"
              />
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-[#66DE16] rounded-lg">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#66DE16] animate-pulse"></div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center p-4">
              <Camera className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">Click Start to begin scanning</p>
              {error && (
                <div className="mt-2 text-red-500 text-sm">{error}</div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t">
        <p className="text-sm text-gray-500 text-center">
          Position the QR code within the green frame
        </p>
      </div>
    </Card>
  );
}
