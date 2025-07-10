"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, CameraOff } from "lucide-react";
import { toast } from "sonner";

interface SimpleQrScannerProps {
  onScan: (result: string) => void;
}

export function SimpleQrScanner({ onScan }: SimpleQrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
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

  // Get user media with fallbacks
  const getUserMedia = (
    constraints: MediaStreamConstraints
  ): Promise<MediaStream> => {
    // Modern browsers
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      return navigator.mediaDevices.getUserMedia(constraints);
    }

    // Fallback for older browsers
    const legacyGetUserMedia =
      (navigator as any).getUserMedia ||
      (navigator as any).webkitGetUserMedia ||
      (navigator as any).mozGetUserMedia ||
      (navigator as any).msGetUserMedia;

    if (legacyGetUserMedia) {
      return new Promise((resolve, reject) => {
        legacyGetUserMedia.call(navigator, constraints, resolve, reject);
      });
    }

    return Promise.reject(new Error("Camera not supported in this browser"));
  };

  // Start camera and scanning
  const startScanner = async () => {
    try {
      setError(null);
      setScanStatus("Checking camera support...");

      // Check if camera is supported
      if (!isCameraSupported()) {
        throw new Error(
          "Camera not supported in this browser. Please use Chrome, Firefox, or Edge."
        );
      }

      setScanStatus("Requesting camera access...");

      // Request camera access with fallback
      const mediaStream = await getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
        },
      });

      setStream(mediaStream);
      setScanStatus("Camera access granted, starting video...");

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;

        // Wait for video to load
        videoRef.current.onloadedmetadata = async () => {
          if (videoRef.current) {
            try {
              await videoRef.current.play();
              setIsScanning(true);
              setScanStatus("Camera ready - scanning for QR codes...");

              // Start QR detection
              startQRDetection();

              toast.success("Scanner Started", {
                description: "Point camera at QR code",
              });
            } catch (playError) {
              console.error("Video play error:", playError);
              setError(
                "Could not start video playback. Try clicking on the video area."
              );
              setScanStatus("Video playback failed");
            }
          }
        };

        // Handle video errors
        videoRef.current.onerror = (e) => {
          console.error("Video error:", e);
          setError("Video stream error");
          setScanStatus("Video error occurred");
        };
      }
    } catch (err: any) {
      console.error("Scanner error:", err);

      let errorMessage = "Camera access failed. ";

      if (err.name === "NotAllowedError") {
        errorMessage =
          "Camera permission denied. Please allow camera access and try again.";
      } else if (err.name === "NotFoundError") {
        errorMessage =
          "No camera found. Please connect a camera and try again.";
      } else if (err.name === "NotSupportedError") {
        errorMessage =
          "Camera not supported in this browser. Please use Chrome, Firefox, or Edge.";
      } else if (err.message.includes("not supported")) {
        errorMessage =
          "Camera not supported in this browser. Please use Chrome, Firefox, or Edge.";
      } else {
        errorMessage = `Camera error: ${err.message || "Unknown error"}`;
      }

      setError(errorMessage);
      setScanStatus("Camera access failed");
      toast.error("Camera Error", {
        description: errorMessage,
      });
    }
  };

  // QR Detection function
  const startQRDetection = async () => {
    try {
      setScanStatus("Loading QR scanner...");

      // Import jsQR with error handling
      const jsQR = (await import("jsqr")).default;

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Could not create canvas context");
      }

      setScanStatus("QR scanner ready - scanning...");

      const scanFrame = () => {
        if (!isScanning || !videoRef.current || !ctx) return;

        const video = videoRef.current;

        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          try {
            // Set canvas size to match video
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;

            // Draw video frame to canvas
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Get image data
            const imageData = ctx.getImageData(
              0,
              0,
              canvas.width,
              canvas.height
            );

            // Scan for QR code
            const code = jsQR(
              imageData.data,
              imageData.width,
              imageData.height,
              {
                inversionAttempts: "dontInvert",
              }
            );

            if (code && code.data) {
              console.log("QR Code found:", code.data);
              setScanStatus("QR Code detected!");
              onScan(code.data);
              stopScanner();
              toast.success("QR Code Scanned!", {
                description: `Detected: ${code.data.substring(0, 30)}...`,
              });
              return;
            } else {
              setScanStatus("Scanning... (hold QR code steady)");
            }
          } catch (frameError) {
            console.error("Frame processing error:", frameError);
          }
        } else {
          setScanStatus("Waiting for video to load...");
        }

        // Continue scanning
        if (isScanning) {
          requestAnimationFrame(scanFrame);
        }
      };

      // Start the scanning loop
      scanFrame();
    } catch (importError) {
      console.error("jsQR import error:", importError);
      setError("QR scanner library failed to load");
      setScanStatus("Scanner library error");
    }
  };

  // Stop scanner
  const stopScanner = () => {
    setIsScanning(false);
    setScanStatus("Scanner stopped");

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
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
              {/* Video element */}
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                style={{
                  display: "block",
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  backgroundColor: "#000",
                }}
                playsInline
                muted
                autoPlay
                onClick={() => {
                  // Try to play video if it's paused
                  if (videoRef.current && videoRef.current.paused) {
                    videoRef.current.play().catch(console.error);
                  }
                }}
              />

              {/* Scanning overlay */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-green-400 rounded-lg">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-green-400 animate-pulse"></div>
                </div>

                {/* Corner markers */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64">
                  <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-green-400"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-green-400"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-green-400"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-green-400"></div>
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
