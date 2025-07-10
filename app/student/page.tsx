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
  const [videoLoaded, setVideoLoaded] = useState(false);

  // Start camera and scanning
  const startScanner = async () => {
    try {
      setError(null);
      setVideoLoaded(false);
      setScanStatus("Starting camera...");

      // Check camera support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera not supported in this browser");
      }

      // Get camera stream
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
        },
      });

      setStream(mediaStream);
      setScanStatus("Camera started, loading video...");

      if (videoRef.current) {
        // Set video source
        videoRef.current.srcObject = mediaStream;

        // Handle video loaded
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            setScanStatus("Video loaded, starting playback...");

            videoRef.current
              .play()
              .then(() => {
                setVideoLoaded(true);
                setIsScanning(true);
                setScanStatus("Camera ready - scanning for QR codes...");
                startQRDetection();

                toast.success("Camera Started", {
                  description: "You should see the camera feed now",
                });
              })
              .catch((playError) => {
                console.error("Video play error:", playError);
                setError(
                  "Could not start video. Click the video area to start."
                );
                setScanStatus("Click video to start");
              });
          }
        };

        // Handle video ready
        videoRef.current.oncanplay = () => {
          setScanStatus("Video ready to play...");
        };

        // Handle video playing
        videoRef.current.onplaying = () => {
          setVideoLoaded(true);
          setScanStatus("Video is playing - scanning...");
        };

        // Handle video errors
        videoRef.current.onerror = (e) => {
          console.error("Video error:", e);
          setError("Video stream error");
          setScanStatus("Video error");
        };
      }
    } catch (err: any) {
      console.error("Camera error:", err);

      let errorMessage = "Camera access failed. ";
      if (err.name === "NotAllowedError") {
        errorMessage = "Camera permission denied. Please allow camera access.";
      } else if (err.name === "NotFoundError") {
        errorMessage = "No camera found on this device.";
      } else {
        errorMessage = err.message || "Unknown camera error";
      }

      setError(errorMessage);
      setScanStatus("Camera failed");
      toast.error("Camera Error", { description: errorMessage });
    }
  };

  // QR Detection
  const startQRDetection = async () => {
    try {
      const jsQR = (await import("jsqr")).default;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) return;

      const scanFrame = () => {
        if (!isScanning || !videoRef.current || !ctx) return;

        const video = videoRef.current;

        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);

          if (code && code.data) {
            console.log("QR Code found:", code.data);
            setScanStatus("QR Code detected!");
            onScan(code.data);
            stopScanner();
            toast.success("QR Code Scanned!", {
              description: `Found: ${code.data.substring(0, 30)}...`,
            });
            return;
          }
        }

        if (isScanning) {
          requestAnimationFrame(scanFrame);
        }
      };

      scanFrame();
    } catch (error) {
      console.error("QR detection error:", error);
    }
  };

  // Stop scanner
  const stopScanner = () => {
    setIsScanning(false);
    setVideoLoaded(false);
    setScanStatus("Scanner stopped");

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Manual video play
  const playVideo = () => {
    if (videoRef.current) {
      videoRef.current
        .play()
        .then(() => {
          setVideoLoaded(true);
          setScanStatus("Video playing manually");
        })
        .catch((error) => {
          console.error("Manual play failed:", error);
        });
    }
  };

  useEffect(() => {
    return () => stopScanner();
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
        </div>
      </div>

      <div className="relative">
        <div className="w-full h-96 bg-gray-900 flex items-center justify-center overflow-hidden rounded">
          {isScanning ? (
            <div className="relative w-full h-full">
              {/* Video Element - This should show your camera */}
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
                autoPlay
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                  backgroundColor: "#000",
                }}
                onClick={playVideo}
              />

              {/* Show message if video not loaded */}
              {!videoLoaded && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                    <p>Loading camera...</p>
                    <p className="text-sm mt-1">
                      Click here if video doesn't start
                    </p>
                  </div>
                </div>
              )}

              {/* Scanning overlay - only show when video is loaded */}
              {videoLoaded && (
                <div className="absolute inset-0 pointer-events-none">
                  {/* Scanning frame */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-green-400 rounded-lg">
                    {/* Animated scanning line */}
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-green-400 animate-pulse"></div>
                  </div>

                  {/* Corner markers */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64">
                    <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-green-400"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-green-400"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-green-400"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-green-400"></div>
                  </div>

                  {/* Status overlay */}
                  <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded text-center text-sm">
                    Scanning for QR codes...
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center p-8">
              <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg mb-2">Camera Preview</p>
              <p className="text-gray-500">
                Click Start to see live camera feed
              </p>
              {error && (
                <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t">
        <div className="text-center">
          <p className="text-sm font-medium text-gray-700">{scanStatus}</p>
          <p className="text-xs text-gray-500 mt-1">
            {videoLoaded
              ? "Hold QR code steady in the green frame"
              : isScanning
              ? "Waiting for camera to load..."
              : "Click Start to begin scanning"}
          </p>
        </div>
      </div>
    </Card>
  );
}
