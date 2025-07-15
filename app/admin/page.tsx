"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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
import { ArrowLeft, Loader2, Shield, Lock, Mail, ScanLine } from "lucide-react";
import { useAuth } from "@/components/auth-provider";

export default function AdminLoginPage() {
  const router = useRouter();
  const { signIn, user } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (user) {
      router.push("/admin/dashboard");
    }
  }, [user, router]);

  // Avoid rendering login form if user is already logged in
  if (user) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signIn(email, password);
      router.push("/admin/dashboard");
    } catch (error: any) {
      console.error("Login error:", error);

      let errorMessage = "Failed to login. Please check your credentials.";
      if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password"
      ) {
        errorMessage = "Invalid email or password";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage =
          "Too many failed login attempts. Please try again later.";
      }

      toast.error("Login Failed", {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

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
            <Button
              variant="outline"
              className="border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 font-medium"
              onClick={() => router.push("/")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto py-12 px-6">
        <div className="max-w-md mx-auto">
          <Card className="border-0 shadow-2xl bg-white overflow-hidden">
            <CardHeader className="bg-emerald-50 text-center pb-6 pt-8">
              <div className="mx-auto bg-emerald-100 p-6 rounded-2xl mb-4">
                <ScanLine className="h-12 w-12 text-emerald-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-slate-800 mb-2">
                Admin Portal
              </CardTitle>
              <CardDescription className="text-slate-600 font-medium">
                Secure access to the administrative dashboard
              </CardDescription>
            </CardHeader>

            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  <Label
                    htmlFor="email"
                    className="text-slate-700 font-semibold"
                  >
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@university.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-10 h-12 border-slate-300 focus:border-blue-500 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label
                    htmlFor="password"
                    className="text-slate-700 font-semibold"
                  >
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your secure password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pl-10 h-12 border-slate-300 focus:border-blue-500 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-12 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-5 w-5" />
                      Secure Login
                    </>
                  )}
                </Button>
              </form>
            </CardContent>

            <CardFooter className="bg-slate-50 p-6">
              <div className="w-full text-center">
                <div className="flex items-center justify-center gap-2 text-sm text-slate-600 mb-2">
                  <Lock className="h-4 w-4 text-slate-500" />
                  <span className="font-medium">
                    Secure Authentication Required
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Admin access is restricted to authorized personnel only
                </p>
              </div>
            </CardFooter>
          </Card>

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="p-1 bg-blue-100 rounded-full">
                <Shield className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-800 text-sm mb-1">
                  Security Notice
                </h3>
                <p className="text-xs text-blue-700 leading-relaxed">
                  All login attempts are monitored and logged. Unauthorized
                  access attempts will be reported to the appropriate
                  authorities.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-slate-800 text-white mt-12">
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
                Administrative Portal
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
