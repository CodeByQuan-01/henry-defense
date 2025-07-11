"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, CameraOff } from "lucide-react";
import { toast } from "sonner";
import { Scanner } from "@yudiel/react-qr-scanner";

interface SimpleQrScannerProps {
  onScan: (result: string) => void;
  scanDelay?: number;
}

export function SimpleQrScanner({
  onScan,
  scanDelay = 300,
}: SimpleQrScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanStatus, setScanStatus] = useState<string>("Ready to scan");

  // Check if camera is supported
  const isCameraSupported = () => {
    return !!(
      navigator &&
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia
    );
  };

  // Start scanner
  const startScanner = () => {
    if (!isCameraSupported()) {
      setError(
        "Camera not supported in this browser. Please use Chrome, Firefox, or Edge."
      );
      setScanStatus("Camera not supported");
      toast.error("Camera Error", {
        description:
          "Camera not supported in this browser. Please use Chrome, Firefox, or Edge.",
      });
      return;
    }
    setError(null);
    setScanStatus("Starting QR scanner...");
    setIsScanning(true);
  };

  // Stop scanner
  const stopScanner = () => {
    setIsScanning(false);
    setScanStatus("Scanner stopped");
  };

  // Handle scan result
  const handleScan = (result: string) => {
    if (result) {
      setScanStatus("QR Code detected!");
      onScan(result);
      stopScanner();
      toast.success("QR Code Scanned!", {
        description: `Detected: ${result.substring(0, 30)}...`,
      });
    }
  };

  // Handle scan errors
  const handleError = (err: Error) => {
    console.error("Scanner error:", err);
    let errorMessage = "QR scanning failed.";

    if (err.name === "NotAllowedError") {
      errorMessage =
        "Camera permission denied. Please allow camera access and try again.";
    } else if (err.name === "NotFoundError") {
      errorMessage = "No camera found. Please connect a camera and try again.";
    } else if (err.name === "NotSupportedError") {
      errorMessage =
        "Camera not supported in this browser. Please use Chrome, Firefox, or Edge.";
    } else {
      errorMessage = `Scanner error: ${err.message || "Unknown error"}`;
    }

    setError(errorMessage);
    setScanStatus("Scanner failed");
    setIsScanning(false);
    toast.error("Scanner Error", {
      description: errorMessage,
    });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
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
            <Button
              variant="outline"
              size="sm"
              onClick={startScanner}
              disabled={!isCameraSupported()}
            >
              <Camera className="h-4 w-4 mr-1" />
              Start
            </Button>
          )}
        </div>
      </div>

      <div className="relative">
        <div className="w-full aspect-square bg-black flex items-center justify-center overflow-hidden">
          {!isCameraSupported() ? (
            <div className="text-center p-4">
              <Camera className="h-12 w-12 text-red-300 mx-auto mb-2" />
              <p className="text-red-500">
                Camera not supported in this browser
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Please use Chrome, Firefox, or Edge
              </p>
            </div>
          ) : isScanning ? (
            <div className="relative w-full h-full">
              <Scanner
                onScan={handleScan}
                onError={handleError}
                constraints={{ facingMode: "environment" }}
                scanDelay={scanDelay}
                styles={{
                  container: { width: "100%", height: "100%" },
                  video: { objectFit: "cover" },
                }}
              />
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-green-400 rounded-lg">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-green-400 animate-pulse"></div>
                </div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64">
                  <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-green-400"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-green-400"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-green-400"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-green-400"></div>
                </div>
                <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded text-center text-sm">
                  {scanStatus}
                </div>
              </div>
            </div>
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
        <div className="text-center">
          <p className="text-sm font-medium text-gray-700">{scanStatus}</p>
          <p className="text-xs text-gray-500 mt-1">
            {isScanning
              ? "Hold QR code steady in the green frame"
              : "Position QR code in the frame when scanning"}
          </p>
          {!isCameraSupported() && (
            <p className="text-xs text-red-500 mt-1">
              Camera API not available. Please use a modern browser with HTTPS.
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
