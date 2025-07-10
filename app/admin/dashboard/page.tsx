"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  LogOut,
  Search,
  ScanLine,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Filter,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  doc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { SimpleQrScanner } from "@/components/simple-qr-scanner";
import { StudentDetails } from "@/components/student-detail";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ManualEntry } from "@/components/manual-entry";
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

type Student = {
  id: string;
  fullName: string;
  matricNumber: string;
  faculty: string;
  department: string;
  photoUrl: string;
  status: "Pending" | "Verified" | "Rejected";
  createdAt: any;
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const [activeTab, setActiveTab] = useState("scan");
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [scannedStudentId, setScannedStudentId] = useState<string | null>(null);
  const [scannedStudent, setScannedStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  // Redirect if not logged in
  useEffect(() => {
    if (!user && !loading) {
      router.push("/admin");
    }
  }, [user, router, loading]);

  // Fetch students data
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const studentsCollection = collection(db, "students");
        const studentsQuery = query(
          studentsCollection,
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(studentsQuery);

        const studentsData: Student[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data() as Omit<Student, "id">;
          studentsData.push({
            id: doc.id,
            ...data,
          });
        });

        setStudents(studentsData);
        setFilteredStudents(studentsData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching students:", error);
        toast.error("Error", {
          description: "Failed to load student data",
        });
        setLoading(false);
      }
    };

    if (user) {
      fetchStudents();
    }
  }, [user]);

  // Filter students based on search query and status filter
  useEffect(() => {
    let filtered = students;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (student) =>
          student.fullName.toLowerCase().includes(query) ||
          student.matricNumber.toLowerCase().includes(query) ||
          student.department.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((student) => student.status === statusFilter);
    }

    setFilteredStudents(filtered);
  }, [searchQuery, statusFilter, students]);

  // Handle QR code scan
  const handleScan = async (studentId: string) => {
    if (!studentId || studentId.trim() === "") {
      toast.error("Invalid QR Code", {
        description: "QR code appears to be empty",
      });
      return;
    }

    try {
      setLoading(true);
      console.log("Scanned QR code:", studentId);

      let processedId = studentId.trim();

      // Try different ways to extract the student ID
      // 1. Check if it's already a valid Firebase document ID (20 characters)
      if (/^[a-zA-Z0-9]{20}$/.test(processedId)) {
        // Already a valid ID, use as is
      }
      // 2. Try to parse as JSON
      else if (processedId.startsWith("{") || processedId.startsWith("[")) {
        try {
          const parsedData = JSON.parse(processedId);
          if (parsedData && parsedData.id) {
            processedId = parsedData.id;
          } else if (parsedData && parsedData.studentId) {
            processedId = parsedData.studentId;
          }
        } catch (e) {
          console.log("Not valid JSON:", e);
        }
      }
      // 3. Check if it's a URL with the ID as a parameter
      else if (processedId.includes("student") || processedId.includes("id=")) {
        const urlMatch = processedId.match(/id=([a-zA-Z0-9]{20})/);
        if (urlMatch) {
          processedId = urlMatch[1];
        }
      }
      // 4. If it looks like it might contain an ID, try to extract it
      else {
        const idMatch = processedId.match(/[a-zA-Z0-9]{20}/);
        if (idMatch) {
          processedId = idMatch[0];
        }
      }

      console.log("Processing student ID:", processedId);

      // Validate the processed ID
      if (!/^[a-zA-Z0-9]{20}$/.test(processedId)) {
        toast.error("Invalid QR Code Format", {
          description: "This doesn't appear to be a valid student QR code",
        });
        setLoading(false);
        return;
      }

      // Try to find the student document
      const studentSnapshot = await getDocs(
        query(collection(db, "students"), where("__name__", "==", processedId))
      );

      if (studentSnapshot.empty) {
        toast.error("Student Not Found", {
          description: "No student record found for this QR code",
        });
        setLoading(false);
        return;
      }

      const studentData = studentSnapshot.docs[0].data() as Omit<Student, "id">;
      const student: Student = {
        id: studentSnapshot.docs[0].id,
        ...studentData,
      };

      setScannedStudentId(processedId);
      setScannedStudent(student);

      // Log the scan
      try {
        await addDoc(collection(db, "scanLogs"), {
          studentId: processedId,
          adminId: user?.uid || "unknown",
          adminEmail: user?.email || "unknown",
          timestamp: serverTimestamp(),
          rawQrData: studentId, // Store the original QR data for debugging
        });
      } catch (logError) {
        console.error("Error logging scan:", logError);
        // Don't fail the whole operation if logging fails
      }

      toast.success("QR Code Scanned Successfully!", {
        description: `Found student: ${student.fullName}`,
      });
    } catch (error) {
      console.error("Error scanning QR code:", error);
      toast.error("Scan Error", {
        description: "Failed to process QR code. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Update student status
  const updateStudentStatus = async (
    studentId: string,
    status: "Pending" | "Verified" | "Rejected"
  ) => {
    try {
      const studentRef = doc(db, "students", studentId);
      await updateDoc(studentRef, {
        status,
        verifiedAt: status === "Verified" ? serverTimestamp() : null,
        verifiedBy: status === "Verified" ? user?.email : null,
      });

      // Update local state
      setStudents((prevStudents) =>
        prevStudents.map((student) =>
          student.id === studentId ? { ...student, status } : student
        )
      );

      if (scannedStudent && scannedStudent.id === studentId) {
        setScannedStudent({ ...scannedStudent, status });
      }

      toast.success("Status Updated", {
        description: `Student status updated to ${status}`,
      });
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Error", {
        description: "Failed to update student status",
      });
    }
  };

  // Export students data as CSV
  const exportToCSV = () => {
    const headers = [
      "Full Name",
      "Matric Number",
      "Faculty",
      "Department",
      "Status",
      "Created At",
    ];

    const csvData = filteredStudents.map((student) => [
      student.fullName,
      student.matricNumber,
      student.faculty,
      student.department,
      student.status,
      student.createdAt?.toDate().toLocaleString() || "N/A",
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `students_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut();
      router.push("/admin");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <header className="bg-[#213B94] text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl md:text-2xl font-bold">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="hidden md:inline-block text-sm">
              Logged in as: {user.email}
            </span>
            <Button
              variant="ghost"
              className="text-white hover:bg-[#213B94]/80"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4">
        <Tabs
          defaultValue="scan"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="scan" className="text-[#1B1F3B]">
              <ScanLine className="mr-2 h-4 w-4" /> Scan QR Code
            </TabsTrigger>
            <TabsTrigger value="students" className="text-[#1B1F3B]">
              <Users className="mr-2 h-4 w-4" /> Student Records
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scan" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-[#1B1F3B]">
                  Scan Student QR Code
                </CardTitle>
                <CardDescription>
                  Use your device camera to scan a student QR code
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <SimpleQrScanner onScan={handleScan} />
                    <ManualEntry onSubmit={handleScan} />
                  </div>
                  <div>
                    {scannedStudent ? (
                      <StudentDetails
                        student={scannedStudent}
                        onUpdateStatus={updateStudentStatus}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full p-6 border rounded-lg bg-gray-50">
                        <ScanLine className="h-16 w-16 text-gray-300 mb-4" />
                        <p className="text-center text-gray-500">
                          Scan a QR code or enter ID manually to view student
                          details
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students">
            <Card>
              <CardHeader>
                <CardTitle className="text-[#1B1F3B]">
                  Student Records
                </CardTitle>
                <CardDescription>
                  View and manage all student records
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                  <div className="relative w-full md:w-auto flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Search by name or matric number..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-2 w-full md:w-auto">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="flex gap-2 bg-transparent"
                        >
                          <Filter className="h-4 w-4" />
                          {statusFilter === "all" ? "All Status" : statusFilter}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem
                          onClick={() => setStatusFilter("all")}
                        >
                          All Status
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setStatusFilter("Pending")}
                        >
                          Pending
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setStatusFilter("Verified")}
                        >
                          Verified
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setStatusFilter("Rejected")}
                        >
                          Rejected
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                      variant="outline"
                      className="flex gap-2 bg-transparent"
                      onClick={exportToCSV}
                    >
                      <Download className="h-4 w-4" />
                      Export
                    </Button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="text-left p-3 border">Name</th>
                        <th className="text-left p-3 border">Matric Number</th>
                        <th className="text-left p-3 border hidden md:table-cell">
                          Faculty
                        </th>
                        <th className="text-left p-3 border hidden md:table-cell">
                          Department
                        </th>
                        <th className="text-left p-3 border">Status</th>
                        <th className="text-left p-3 border">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={6} className="text-center p-4">
                            <div className="flex justify-center">
                              <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                          </td>
                        </tr>
                      ) : filteredStudents.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="text-center p-4 text-gray-500"
                          >
                            No students found
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map((student) => (
                          <tr key={student.id} className="hover:bg-gray-50">
                            <td className="p-3 border">{student.fullName}</td>
                            <td className="p-3 border">
                              {student.matricNumber}
                            </td>
                            <td className="p-3 border hidden md:table-cell">
                              {student.faculty}
                            </td>
                            <td className="p-3 border hidden md:table-cell">
                              {student.department}
                            </td>
                            <td className="p-3 border">
                              <div className="flex items-center">
                                {student.status === "Verified" && (
                                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                                )}
                                {student.status === "Rejected" && (
                                  <XCircle className="h-4 w-4 text-red-500 mr-1" />
                                )}
                                {student.status === "Pending" && (
                                  <Clock className="h-4 w-4 text-yellow-500 mr-1" />
                                )}
                                {student.status}
                              </div>
                            </td>
                            <td className="p-3 border">
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 px-2 text-xs bg-transparent"
                                  onClick={() => {
                                    setScannedStudentId(student.id);
                                    setScannedStudent(student);
                                    setActiveTab("scan");
                                  }}
                                >
                                  View
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-8 px-2 text-xs bg-transparent"
                                    >
                                      Status
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        updateStudentStatus(
                                          student.id,
                                          "Verified"
                                        )
                                      }
                                      className="text-green-600"
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Verify
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        updateStudentStatus(
                                          student.id,
                                          "Rejected"
                                        )
                                      }
                                      className="text-red-600"
                                    >
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Reject
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        updateStudentStatus(
                                          student.id,
                                          "Pending"
                                        )
                                      }
                                      className="text-yellow-600"
                                    >
                                      <Clock className="h-4 w-4 mr-2" />
                                      Mark as Pending
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <footer className="bg-[#213B94] text-white p-6 mt-8">
        <div className="container mx-auto text-center">
          <p>© {new Date().getFullYear()} University QR Verification System</p>
        </div>
      </footer>
    </div>
  );
}
