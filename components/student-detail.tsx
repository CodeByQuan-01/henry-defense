"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, Shield } from "lucide-react";

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

interface StudentDetailsProps {
  student: Student;
  onUpdateStatus: (
    studentId: string,
    status: "Pending" | "Verified" | "Rejected"
  ) => void;
}

export function StudentDetails({
  student,
  onUpdateStatus,
}: StudentDetailsProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "Verified":
        return {
          badge:
            "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200",
          icon: CheckCircle,
          iconBg: "bg-emerald-100",
          iconColor: "text-emerald-600",
        };
      case "Rejected":
        return {
          badge: "bg-red-100 text-red-800 hover:bg-red-100 border-red-200",
          icon: XCircle,
          iconBg: "bg-red-100",
          iconColor: "text-red-600",
        };
      default:
        return {
          badge: "bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200",
          icon: Clock,
          iconBg: "bg-blue-100",
          iconColor: "text-blue-600",
        };
    }
  };

  const statusConfig = getStatusConfig(student.status);
  const StatusIcon = statusConfig.icon;

  return (
    <Card className="shadow-lg border-0 bg-white">
      {/* Header with VerifyMe Branding */}
      <CardHeader
        className={`pb-4 ${
          student.status === "Verified" ? "bg-emerald-50" : "bg-slate-50"
        } rounded-t-lg`}
      >
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Shield className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-slate-800">
                {student.fullName}
              </CardTitle>
              <p className="text-sm text-slate-600 font-medium">
                VerifyMe - Student Authentication
              </p>
            </div>
          </div>
          <Badge
            className={`${statusConfig.badge} font-semibold border px-3 py-1`}
          >
            <div className={`p-1 rounded-full ${statusConfig.iconBg} mr-2`}>
              <StatusIcon className={`h-3 w-3 ${statusConfig.iconColor}`} />
            </div>
            {student.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Student Photo */}
          <div className="flex-shrink-0">
            <div className="relative h-36 w-36 overflow-hidden rounded-xl border-2 border-slate-200 shadow-md">
              <img
                src={student.photoUrl || "/placeholder.svg"}
                alt={student.fullName}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
            </div>
          </div>

          {/* Student Information */}
          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                  Matric Number
                </p>
                <p className="font-bold text-slate-800 text-lg mt-1">
                  {student.matricNumber}
                </p>
              </div>

              <div className="bg-teal-50 p-4 rounded-lg">
                <p className="text-sm font-semibold text-teal-600 uppercase tracking-wide">
                  Status
                </p>
                <p
                  className={`font-bold text-lg mt-1 ${
                    student.status === "Verified"
                      ? "text-emerald-700"
                      : student.status === "Rejected"
                      ? "text-red-700"
                      : "text-blue-700"
                  }`}
                >
                  {student.status}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                  Faculty
                </p>
                <p className="font-medium text-slate-800 text-base mt-1">
                  {student.faculty}
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                  Department
                </p>
                <p className="font-medium text-slate-800 text-base mt-1">
                  {student.department}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Action Buttons */}
      <CardFooter className="px-6 pb-6 pt-2">
        <div className="grid grid-cols-3 gap-3 w-full">
          <Button
            className={`
              font-semibold h-12 transition-all duration-200 shadow-md
              ${
                student.status === "Verified"
                  ? "bg-emerald-100 text-emerald-700 border-2 border-emerald-300 cursor-not-allowed"
                  : "bg-white text-emerald-700 border-2 border-emerald-500 hover:bg-emerald-50 hover:border-emerald-600 hover:shadow-lg hover:-translate-y-0.5"
              }
            `}
            onClick={() => onUpdateStatus(student.id, "Verified")}
            disabled={student.status === "Verified"}
          >
            <div className="p-1 bg-emerald-100 rounded-full mr-2">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            </div>
            Verify
          </Button>

          <Button
            className={`
              font-semibold h-12 transition-all duration-200 shadow-md
              ${
                student.status === "Rejected"
                  ? "bg-red-100 text-red-700 border-2 border-red-300 cursor-not-allowed"
                  : "bg-white text-red-700 border-2 border-red-500 hover:bg-red-50 hover:border-red-600 hover:shadow-lg hover:-translate-y-0.5"
              }
            `}
            onClick={() => onUpdateStatus(student.id, "Rejected")}
            disabled={student.status === "Rejected"}
          >
            <div className="p-1 bg-red-100 rounded-full mr-2">
              <XCircle className="h-4 w-4 text-red-600" />
            </div>
            Reject
          </Button>

          <Button
            className={`
              font-semibold h-12 transition-all duration-200 shadow-md
              ${
                student.status === "Pending"
                  ? "bg-blue-100 text-blue-700 border-2 border-blue-300 cursor-not-allowed"
                  : "bg-white text-blue-700 border-2 border-blue-500 hover:bg-blue-50 hover:border-blue-600 hover:shadow-lg hover:-translate-y-0.5"
              }
            `}
            onClick={() => onUpdateStatus(student.id, "Pending")}
            disabled={student.status === "Pending"}
          >
            <div className="p-1 bg-blue-100 rounded-full mr-2">
              <Clock className="h-4 w-4 text-blue-600" />
            </div>
            Pending
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
