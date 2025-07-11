"use client";

import type React from "react";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ArrowLeft, Upload, Download } from "lucide-react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Faculties and departments
const faculties = [
  {
    id: "engineering",
    name: "Engineering",
    departments: [
      "Computer Engineering",
      "Electrical Engineering",
      "Mechanical Engineering",
      "Civil Engineering",
    ],
  },
  {
    id: "science",
    name: "Science",
    departments: [
      "Computer Science",
      "Mathematics",
      "Physics",
      "Chemistry",
      "Biology",
    ],
  },
  {
    id: "arts",
    name: "Arts",
    departments: ["English", "History", "Philosophy", "Languages"],
  },
  {
    id: "business",
    name: "Business",
    departments: ["Accounting", "Finance", "Marketing", "Management"],
  },
  {
    id: "medicine",
    name: "Medicine",
    departments: ["Medicine", "Nursing", "Pharmacy", "Public Health"],
  },
];

// Available levels
const levels = ["100", "200", "300", "400", "500"];

export default function StudentPage() {
  const router = useRouter();
  const qrCodeRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [studentId, setStudentId] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    matricNumber: "",
    faculty: "",
    department: "",
    level: "",
    photo: null as File | null,
    photoPreview: "",
  });

  const [availableDepartments, setAvailableDepartments] = useState<string[]>(
    []
  );

  const handleFacultyChange = (value: string) => {
    const faculty = faculties.find((f) => f.id === value);
    setFormData({
      ...formData,
      faculty: value,
      department: "",
    });

    if (faculty) {
      setAvailableDepartments(faculty.departments);
    } else {
      setAvailableDepartments([]);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();

      reader.onload = (event) => {
        if (event.target) {
          setFormData({
            ...formData,
            photo: file,
            photoPreview: event.target.result as string,
          });
        }
      };

      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate form
      if (
        !formData.fullName ||
        !formData.matricNumber ||
        !formData.faculty ||
        !formData.department ||
        !formData.level ||
        !formData.photo
      ) {
        toast.error("Missing Information", {
          description: "Please fill in all fields and upload a photo",
        });
        setLoading(false);
        return;
      }

      // Validate image type
      if (!["image/jpeg", "image/png"].includes(formData.photo.type)) {
        toast.error("Invalid Image", {
          description: "Please upload a valid JPEG or PNG image",
        });
        setLoading(false);
        return;
      }

      // Upload image to Cloudinary
      const cloudinaryData = new FormData();
      cloudinaryData.append("file", formData.photo);
      cloudinaryData.append("upload_preset", "StudentQr");

      const cloudinaryResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: cloudinaryData,
        }
      );

      const cloudinaryResult = await cloudinaryResponse.json();

      if (!cloudinaryResponse.ok) {
        throw new Error(
          cloudinaryResult.error?.message || "Failed to upload image"
        );
      }

      if (!cloudinaryResult.secure_url) {
        throw new Error("Image upload failed: No secure URL returned");
      }

      // Save to Firebase
      const facultyName =
        faculties.find((f) => f.id === formData.faculty)?.name || "";

      const docRef = await addDoc(collection(db, "students"), {
        fullName: formData.fullName,
        matricNumber: formData.matricNumber,
        faculty: facultyName,
        department: formData.department,
        level: formData.level,
        photoUrl: cloudinaryResult.secure_url,
        status: "Pending",
        createdAt: serverTimestamp(),
      });

      setStudentId(docRef.id);
      setStep(2);

      toast.success("Success!", {
        description: "Your ID card has been generated successfully",
      });
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("Error", {
        description:
          error.message ||
          "There was an error processing your request. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadIDCard = () => {
    // Create a canvas element for the ID card
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 800;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Fill with white background
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw university header
    ctx.fillStyle = "#213B94";
    ctx.fillRect(0, 0, canvas.width, 80);
    ctx.fillStyle = "white";
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "center";
    ctx.fillText("UNIVERSITY NAME", canvas.width / 2, 40);
    ctx.font = "12px Arial";
    ctx.fillText("OFFICIAL STUDENT ID CARD", canvas.width / 2, 60);

    // Draw student photo if available
    if (formData.photoPreview) {
      const img = new Image();
      img.src = formData.photoPreview;
      img.onload = () => {
        // Draw photo with border
        ctx.strokeStyle = "#213B94";
        ctx.lineWidth = 2;
        ctx.strokeRect(30, 100, 150, 150);
        ctx.drawImage(img, 30, 100, 150, 150);

        // Draw student information
        ctx.fillStyle = "black";
        ctx.font = "14px Arial";
        ctx.textAlign = "left";

        // Full Name
        ctx.fillText("Full Name:", 200, 120);
        ctx.font = "bold 16px Arial";
        ctx.fillText(formData.fullName, 200, 140);

        // Matric Number
        ctx.font = "14px Arial";
        ctx.fillText("Matric Number:", 200, 170);
        ctx.font = "bold 16px Arial";
        ctx.fillText(formData.matricNumber, 200, 190);

        // Faculty/Department
        ctx.font = "14px Arial";
        ctx.fillText("Faculty/Department:", 200, 220);
        ctx.font = "bold 16px Arial";
        ctx.fillText(
          `${faculties.find((f) => f.id === formData.faculty)?.name || ""} - ${
            formData.department
          }`,
          200,
          240
        );

        // Level
        ctx.font = "14px Arial";
        ctx.fillText("Level:", 200, 270);
        ctx.font = "bold 16px Arial";
        ctx.fillText(formData.level, 200, 290);

        // Draw QR Code
        const qrCanvas = document.querySelector("canvas");
        if (qrCanvas) {
          ctx.fillStyle = "white";
          ctx.fillRect(canvas.width / 2 - 100, 350, 200, 200);
          ctx.drawImage(qrCanvas, canvas.width / 2 - 75, 375, 150, 150);
        }

        // Add footer text
        ctx.fillStyle = "black";
        ctx.font = "12px Arial";
        ctx.textAlign = "center";
        ctx.fillText(
          "This card is property of University Name",
          canvas.width / 2,
          580
        );
        ctx.fillText(
          `Valid until: ${new Date().getFullYear() + 1}`,
          canvas.width / 2,
          600
        );

        // Add border to entire card
        ctx.strokeStyle = "#213B94";
        ctx.lineWidth = 4;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);

        // Convert canvas to image and download
        const dataUrl = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.download = `${formData.matricNumber}_id_card.png`;
        link.href = dataUrl;
        link.click();
      };
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <header className="bg-[#213B94] text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl md:text-2xl font-bold">
            University QR Verification
          </h1>
          <Button
            variant="ghost"
            className="text-white hover:bg-[#213B94]/80"
            onClick={() => router.push("/")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
          </Button>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4">
        <div className="max-w-md mx-auto">
          {step === 1 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-[#1B1F3B]">
                  Student Registration
                </CardTitle>
                <CardDescription>
                  Enter your details to generate your ID card
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      placeholder="John Doe"
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData({ ...formData, fullName: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="matricNumber">Matric Number</Label>
                    <Input
                      id="matricNumber"
                      placeholder="UNI/2023/001"
                      value={formData.matricNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          matricNumber: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="faculty">Faculty</Label>
                    <Select
                      value={formData.faculty}
                      onValueChange={handleFacultyChange}
                    >
                      <SelectTrigger id="faculty">
                        <SelectValue placeholder="Select Faculty" />
                      </SelectTrigger>
                      <SelectContent>
                        {faculties.map((faculty) => (
                          <SelectItem key={faculty.id} value={faculty.id}>
                            {faculty.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Select
                      value={formData.department}
                      onValueChange={(value) =>
                        setFormData({ ...formData, department: value })
                      }
                      disabled={!formData.faculty}
                    >
                      <SelectTrigger id="department">
                        <SelectValue placeholder="Select Department" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableDepartments.map((department) => (
                          <SelectItem key={department} value={department}>
                            {department}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="level">Level</Label>
                    <Select
                      value={formData.level}
                      onValueChange={(value) =>
                        setFormData({ ...formData, level: value })
                      }
                    >
                      <SelectTrigger id="level">
                        <SelectValue placeholder="Select Level" />
                      </SelectTrigger>
                      <SelectContent>
                        {levels.map((level) => (
                          <SelectItem key={level} value={level}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="photo">Passport Photo</Label>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 items-center">
                      <div className="flex items-center justify-center">
                        <label
                          htmlFor="photo"
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-2 text-gray-500" />
                            <p className="text-xs text-gray-500">
                              Click to upload
                            </p>
                          </div>
                          <input
                            id="photo"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handlePhotoChange}
                            required
                          />
                        </label>
                      </div>

                      {formData.photoPreview && (
                        <div className="relative h-32 w-full overflow-hidden rounded-lg border border-gray-200">
                          <img
                            src={formData.photoPreview}
                            alt="Preview"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-[#213B94] hover:bg-[#213B94]/90"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Generate ID Card"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-[#1B1F3B]">Your ID Card</CardTitle>
                <CardDescription>
                  Keep this ID card for verification purposes
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div
                  className="w-full max-w-sm bg-white rounded-lg shadow-lg overflow-hidden border-4 border-[#213B94]"
                  ref={qrCodeRef}
                >
                  <div className="bg-[#213B94] py-3 px-4 text-white text-center">
                    <h2 className="text-xl font-bold">UNIVERSITY NAME</h2>
                    <p className="text-xs">OFFICIAL STUDENT ID CARD</p>
                  </div>

                  <div className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-24 h-24 border-2 border-[#213B94] rounded-md overflow-hidden">
                        {formData.photoPreview && (
                          <img
                            src={formData.photoPreview}
                            alt="Student Photo"
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="mb-2">
                          <p className="text-xs text-gray-500">Full Name</p>
                          <p className="font-semibold">{formData.fullName}</p>
                        </div>
                        <div className="mb-2">
                          <p className="text-xs text-gray-500">Matric Number</p>
                          <p className="font-semibold">
                            {formData.matricNumber}
                          </p>
                        </div>
                        <div className="mb-2">
                          <p className="text-xs text-gray-500">
                            Faculty/Department
                          </p>
                          <p className="font-semibold">
                            {faculties.find((f) => f.id === formData.faculty)
                              ?.name || ""}{" "}
                            - {formData.department}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Level</p>
                          <p className="font-semibold">{formData.level}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col items-center">
                      <p className="text-xs text-gray-500 mb-2">
                        Scan QR code for verification
                      </p>
                      <div className="bg-white p-2 rounded border border-gray-200">
                        <QRCodeCanvas
                          value={studentId}
                          size={120}
                          level="H"
                          includeMargin={true}
                          bgColor="#FFFFFF"
                          fgColor="#000000"
                        />
                      </div>
                    </div>

                    <div className="mt-4 text-center">
                      <p className="text-xs text-gray-500">
                        This card is property of University Name
                      </p>
                      <p className="text-xs text-gray-500">
                        Valid until: {new Date().getFullYear() + 1}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <Button
                  onClick={downloadIDCard}
                  className="w-full bg-[#66DE16] hover:bg-[#66DE16]/90 text-[#1B1F3B]"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download ID Card
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/")}
                  className="w-full"
                >
                  Return to Home
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </main>

      <footer className="bg-[#213B94] text-white p-6 mt-8">
        <div className="container mx-auto text-center">
          <p>© {new Date().getFullYear()} University QR Verification System</p>
        </div>
      </footer>
    </div>
  );
}
