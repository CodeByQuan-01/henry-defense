"use client";

import type React from "react";
import { useRef } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
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
import {
  Loader2,
  ArrowLeft,
  Upload,
  QrCode,
  User,
  GraduationCap,
  Download,
  Shield,
} from "lucide-react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";
import * as htmlToImage from "html-to-image";

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

const IDCard = ({
  studentId,
  formData,
  photoPreview,
  idCardRef,
}: {
  studentId: string;
  formData: any;
  photoPreview: string;
  idCardRef: React.RefObject<HTMLDivElement | null>;
}) => {
  const facultyName =
    faculties.find((f) => f.id === formData.faculty)?.name || "";

  return (
    <div
      ref={idCardRef}
      className="w-full max-w-md mx-auto bg-white rounded-2xl overflow-hidden shadow-xl border-4 border-slate-100"
    >
      {/* ID Card Header */}
      <div className="bg-blue-600 py-3 px-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-white" />
          <h2 className="text-white font-bold text-lg">University ID Card</h2>
        </div>
        <span className="text-white text-sm font-medium">
          Valid until: 12/2025
        </span>
      </div>

      {/* ID Card Content */}
      <div className="p-6">
        <div className="flex gap-6">
          {/* Photo and QR Code */}
          <div className="flex flex-col items-center gap-4">
            <div className="w-24 h-24 rounded-lg overflow-hidden border-2 border-slate-200">
              <img
                src={photoPreview || "/placeholder.svg"}
                alt="Student"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="bg-white p-2 rounded-lg border border-slate-200">
              <QRCodeCanvas
                value={studentId}
                size={100}
                level="H"
                includeMargin={false}
                bgColor="#FFFFFF"
                fgColor="#1e293b"
              />
            </div>
          </div>

          {/* Student Details */}
          <div className="flex-1">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-slate-800">
                {formData.fullName}
              </h3>
              <p className="text-slate-600 text-sm">{facultyName}</p>
            </div>

            <div className="space-y-2">
              <div>
                <p className="text-xs text-slate-500 font-medium">
                  Matric Number
                </p>
                <p className="text-slate-800 font-bold">
                  {formData.matricNumber}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500 font-medium">Department</p>
                <p className="text-slate-800 font-medium">
                  {formData.department}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500 font-medium">Status</p>
                <p className="text-green-600 font-medium">Active</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-blue-600" />
              <span className="text-xs text-slate-600">Student ID</span>
            </div>
            <div className="text-xs text-slate-500">
              Scan QR to verify authenticity
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function StudentPage() {
  const router = useRouter();
  const idCardRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [studentId, setStudentId] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    matricNumber: "",
    faculty: "",
    department: "",
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
        !formData.photo
      ) {
        toast.error("Missing Information", {
          description: "Please fill in all fields and upload a photo",
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

      if (!cloudinaryResult.secure_url) {
        throw new Error("Failed to upload image");
      }

      // Save to Firebase
      const facultyName =
        faculties.find((f) => f.id === formData.faculty)?.name || "";

      const docRef = await addDoc(collection(db, "students"), {
        fullName: formData.fullName,
        matricNumber: formData.matricNumber,
        faculty: facultyName,
        department: formData.department,
        photoUrl: cloudinaryResult.secure_url,
        status: "Pending",
        createdAt: serverTimestamp(),
      });

      // Update the QR code generation to ensure it's scannable
      setStudentId(docRef.id);
      setStep(2);

      toast.success("Success!", {
        description: "Your ID card has been generated successfully",
      });
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error", {
        description:
          "There was an error processing your request. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = () => {
    const canvas = document.getElementById("qr-code") as HTMLCanvasElement;
    if (canvas) {
      const pngUrl = canvas
        .toDataURL("image/png")
        .replace("image/png", "image/octet-stream");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `${formData.matricNumber}_qrcode.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  const downloadIDCard = async () => {
    if (!idCardRef.current) return;

    try {
      // Increase the scale for better quality
      const dataUrl = await htmlToImage.toPng(idCardRef.current, {
        quality: 1,
        pixelRatio: 3, // Higher resolution
        backgroundColor: "white",
      });

      const link = document.createElement("a");
      link.download = `${formData.matricNumber}_id_card.png`;
      link.href = dataUrl;
      link.click();

      toast.success("ID Card Downloaded", {
        description: "Your ID card has been downloaded successfully",
      });
    } catch (error) {
      console.error("Error downloading ID card:", error);
      toast.error("Download Failed", {
        description: "There was an error downloading your ID card",
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Clean Header */}
      <header className="bg-white shadow-sm border-b-2 border-teal-500">
        <div className="container mx-auto px-4 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-teal-500 p-3 rounded-2xl shadow-lg">
                <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800">
                  VerifyMe
                </h1>
                <p className="text-slate-600 text-sm sm:text-base font-medium">
                  Secure Student Authentication
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="text-teal-600 hover:bg-teal-50 border-teal-200 hover:border-teal-300 transition-all duration-200"
              onClick={() => router.push("/")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-8 sm:py-12 lg:py-16 px-4">
        <div className="max-w-lg mx-auto">
          {step === 1 ? (
            <Card className="shadow-xl border-0 bg-white">
              <CardHeader className="text-center pb-8 bg-slate-50 rounded-t-lg">
                <div className="mx-auto bg-blue-500 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                  <User className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">
                  Student Registration
                </CardTitle>
                <CardDescription className="text-base text-slate-600">
                  Create your secure digital identity
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-3">
                    <Label
                      htmlFor="fullName"
                      className="text-slate-700 font-semibold text-sm"
                    >
                      Full Name
                    </Label>
                    <Input
                      id="fullName"
                      placeholder="Enter your full name"
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData({ ...formData, fullName: e.target.value })
                      }
                      className="h-12 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl"
                      required
                    />
                  </div>

                  <div className="space-y-3">
                    <Label
                      htmlFor="matricNumber"
                      className="text-slate-700 font-semibold text-sm"
                    >
                      Matric Number
                    </Label>
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
                      className="h-12 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <Label
                        htmlFor="faculty"
                        className="text-slate-700 font-semibold text-sm"
                      >
                        Faculty
                      </Label>
                      <Select
                        value={formData.faculty}
                        onValueChange={handleFacultyChange}
                      >
                        <SelectTrigger
                          id="faculty"
                          className="h-12 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl"
                        >
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

                    <div className="space-y-3">
                      <Label
                        htmlFor="department"
                        className="text-slate-700 font-semibold text-sm"
                      >
                        Department
                      </Label>
                      <Select
                        value={formData.department}
                        onValueChange={(value) =>
                          setFormData({ ...formData, department: value })
                        }
                        disabled={!formData.faculty}
                      >
                        <SelectTrigger
                          id="department"
                          className="h-12 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl disabled:bg-slate-50"
                        >
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
                  </div>

                  <div className="space-y-3">
                    <Label
                      htmlFor="photo"
                      className="text-slate-700 font-semibold text-sm"
                    >
                      Passport Photo
                    </Label>
                    <div className="w-full">
                      {!formData.photoPreview ? (
                        <label
                          htmlFor="photo"
                          className="flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors duration-200"
                        >
                          <div className="flex flex-col items-center justify-center py-6">
                            <div className="bg-blue-100 p-4 rounded-2xl mb-4">
                              <Upload className="w-8 h-8 text-blue-600" />
                            </div>
                            <p className="text-sm font-semibold text-slate-700 mb-1">
                              Upload your photo
                            </p>
                            <p className="text-xs text-slate-500">
                              PNG, JPG files up to 10MB
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
                      ) : (
                        <div className="relative">
                          <div className="relative h-44 w-full overflow-hidden rounded-xl border-2 border-slate-200 bg-white">
                            <img
                              src={formData.photoPreview || "/placeholder.svg"}
                              alt="Preview"
                              className="h-full w-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                              <label
                                htmlFor="photo"
                                className="bg-white text-slate-800 px-6 py-3 rounded-xl text-sm font-semibold cursor-pointer hover:bg-slate-100 transition-colors shadow-lg"
                              >
                                Change Photo
                              </label>
                              <input
                                id="photo"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handlePhotoChange}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-base"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <QrCode className="mr-3 h-5 w-5" />
                        Generate ID Card
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-xl border-0 bg-white">
              <CardHeader className="text-center pb-8 bg-emerald-50 rounded-t-lg">
                <div className="mx-auto bg-emerald-500 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                  <QrCode className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">
                  Your Digital ID Card
                </CardTitle>
                <CardDescription className="text-base text-slate-600">
                  Keep this ID card safe for verification
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="flex flex-col items-center space-y-8">
                  <IDCard
                    studentId={studentId}
                    formData={formData}
                    photoPreview={formData.photoPreview}
                    idCardRef={idCardRef}
                  />

                  <div className="bg-slate-50 p-6 rounded-2xl w-full border border-slate-200">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="bg-teal-100 p-2 rounded-xl">
                        <GraduationCap className="h-6 w-6 text-teal-600" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800">
                        Student Details
                      </h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b border-slate-200">
                        <span className="text-slate-600 font-medium">Name</span>
                        <span className="font-semibold text-slate-800">
                          {formData.fullName}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-slate-200">
                        <span className="text-slate-600 font-medium">
                          Matric No.
                        </span>
                        <span className="font-semibold text-slate-800">
                          {formData.matricNumber}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-slate-200">
                        <span className="text-slate-600 font-medium">
                          Faculty
                        </span>
                        <span className="font-semibold text-slate-800">
                          {
                            faculties.find((f) => f.id === formData.faculty)
                              ?.name
                          }
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-slate-600 font-medium">
                          Department
                        </span>
                        <span className="font-semibold text-slate-800">
                          {formData.department}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4 p-8">
                <Button
                  onClick={downloadIDCard}
                  className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-base"
                >
                  <Download className="mr-3 h-5 w-5" />
                  Download ID Card
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/")}
                  className="w-full h-12 border-slate-300 hover:bg-slate-50 rounded-xl font-medium transition-all duration-200"
                >
                  Return to Home
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </main>

      {/* Clean Footer */}
      <footer className="bg-slate-800 text-white py-8 mt-16">
        <div className="container mx-auto text-center px-4">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="bg-teal-500 p-2 rounded-lg">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">VerifyMe</span>
          </div>
          <p className="text-slate-400">
            © {new Date().getFullYear()} Secure Student Authentication System
          </p>
        </div>
      </footer>
    </div>
  );
}
