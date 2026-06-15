"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, X, Eye, EyeOff, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import axios from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/campus-connect/logo";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState("");
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  // Requirement checks
  const requirements = [
    { label: "At least 8 characters", regex: /.{8,}/ },
    { label: "At least one uppercase letter", regex: /[A-Z]/ },
    { label: "At least one number", regex: /[0-9]/ },
    { label: "At least one special character", regex: /[!@#$%^&*(),.?":{}|<>]/ },
  ];

  useEffect(() => {
    if (!token) {
      setError("No reset token provided. Please use the link sent to your email.");
      setVerifying(false);
      return;
    }

    const verify = async () => {
      try {
        const res = await axios.get(`/api/auth/verify-reset-token?token=${token}`);
        if (res.data.success) {
          setUserName(res.data.name || "");
        } else {
          setError(res.data.message || "This password reset link is invalid or has expired.");
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || "This password reset link is invalid or has expired.");
      } finally {
        setVerifying(false);
      }
    };

    verify();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    const allPassed = requirements.every(req => req.regex.test(password));
    if (!allPassed) {
      alert("Please meet all password requirements");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post("/api/auth/reset-password", {
        token,
        password
      });

      if (res.data.success) {
        setSuccess(true);
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Verifying your reset link…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-destructive/5 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-card border border-destructive/20 p-10 rounded-2xl shadow-xl text-center"
        >
          <div className="bg-destructive/10 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <X className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Link Invalid</h1>
          <p className="text-muted-foreground text-sm mb-8 leading-relaxed">{error}</p>
          <Button onClick={() => router.push("/auth/login")} className="w-full h-12 rounded-xl">
            Back to Login
          </Button>
        </motion.div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-card border border-primary/20 p-10 rounded-2xl shadow-xl text-center"
        >
          <div className="bg-emerald-100 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="h-10 w-10 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Password Reset!</h1>
          <p className="text-muted-foreground text-sm mb-8">
            Your password has been reset successfully. You can now log in using your new credentials.
          </p>
          <Button
            className="w-full h-12 rounded-xl text-base font-semibold"
            onClick={() => router.push("/auth/login")}
          >
            Go to Login
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="text-center mb-8">
          <Logo className="h-12 w-12 mx-auto mb-4" />
          <h1 className="text-3xl font-black tracking-tight">Reset Password</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            {userName ? `Hi ${userName}, enter your new password below.` : "Enter your new password below."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-card border p-8 rounded-2xl shadow-xl">
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2 py-2">
            {requirements.map((req, i) => {
              const passed = req.regex.test(password);
              return (
                <div key={i} className="flex items-center gap-2 text-sm">
                  {passed ? (
                    <Check className="h-4 w-4 text-primary" />
                  ) : (
                    <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30 ml-1.5" />
                  )}
                  <span className={passed ? "text-primary font-medium" : "text-muted-foreground"}>
                    {req.label}
                  </span>
                </div>
              );
            })}
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 rounded-xl text-lg font-bold"
            disabled={loading}
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Update Password"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
