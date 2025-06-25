import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import {
  GraduationCap,
  ScanLine,
  Shield,
  CheckCircle,
  Users,
  Lock,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-slate-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-100 rounded-lg">
                <Shield className="h-8 w-8 text-teal-600" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
                  VerifyMe
                </h1>
                <p className="text-sm text-teal-600 font-medium">
                  Secure Student Authentication
                </p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 text-sm text-slate-600">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              <span>Trusted by Universities</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto py-12 px-6">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full font-semibold text-sm mb-6">
              <Shield className="h-4 w-4" />
              Next-Generation Student Verification
            </div>
            <h2 className="text-4xl md:text-6xl font-bold text-slate-800 mb-6 leading-tight">
              Secure Student
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-600">
                {" "}
                Authentication
              </span>
            </h2>
            <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Generate and verify student QR codes with military-grade security.
              Trusted by educational institutions worldwide.
            </p>
          </div>

          {/* Main Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
            {/* Student Portal Card */}
            <Card className="group border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-white overflow-hidden">
              <CardHeader className="bg-slate-50 text-center pb-6 pt-8">
                <div className="mx-auto bg-blue-100 p-6 rounded-2xl mb-4 group-hover:bg-blue-200 transition-colors duration-300">
                  <GraduationCap className="h-12 w-12 text-blue-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-slate-800 mb-2">
                  Student Portal
                </CardTitle>
                <CardDescription className="text-slate-600 font-medium">
                  Generate your secure QR code for instant verification
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center p-6">
                <div className="space-y-4">
                  <p className="text-slate-600 leading-relaxed">
                    Register your details and receive a unique, encrypted QR
                    code for secure identification across campus
                  </p>
                  <div className="flex items-center justify-center gap-4 text-sm text-slate-500">
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      <span>Instant Generation</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Lock className="h-4 w-4 text-emerald-500" />
                      <span>Secure Encryption</span>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-center p-6 pt-2">
                <Button
                  asChild
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 h-12 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5"
                >
                  <Link href="/student" className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    Generate QR Code
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Admin Portal Card */}
            <Card className="group border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-white overflow-hidden">
              <CardHeader className="bg-emerald-50 text-center pb-6 pt-8">
                <div className="mx-auto bg-emerald-100 p-6 rounded-2xl mb-4 group-hover:bg-emerald-200 transition-colors duration-300">
                  <ScanLine className="h-12 w-12 text-emerald-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-slate-800 mb-2">
                  Admin Portal
                </CardTitle>
                <CardDescription className="text-slate-600 font-medium">
                  Scan and verify student QR codes instantly
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center p-6">
                <div className="space-y-4">
                  <p className="text-slate-600 leading-relaxed">
                    Faculty and staff can securely login to scan, verify, and
                    manage student identification with real-time validation
                  </p>
                  <div className="flex items-center justify-center gap-4 text-sm text-slate-500">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-emerald-500" />
                      <span>Multi-User Access</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      <span>Real-time Validation</span>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-center p-6 pt-2">
                <Button
                  asChild
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 py-3 h-12 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5"
                >
                  <Link href="/admin" className="flex items-center gap-2">
                    <ScanLine className="h-5 w-5" />
                    Admin Login
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 text-white">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <div className="p-2 bg-teal-600 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="font-bold text-lg">VerifyMe</div>
                <div className="text-sm text-slate-400">
                  Secure Student Authentication
                </div>
              </div>
            </div>
            <div className="text-center md:text-right">
              <p className="text-slate-300">
                © {new Date().getFullYear()} VerifyMe - Secure Student
                Authentication
              </p>
              <p className="text-sm text-slate-400 mt-1">
                Trusted by universities worldwide
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
