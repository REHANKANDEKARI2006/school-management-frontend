"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, X, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/campus-connect/logo";

export default function SetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState("");
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Password requirements
  const requirements = [
    { label: "At least 8 characters", regex: /.{8,}/ },
    { label: "At least one uppercase letter", regex: /[A-Z]/ },
    { label: "At least one number", regex: /[0-9]/ },
    { label: "At least one special character", regex: /[!@#$%^&*(),.?":{}|<>]/ },
  ];

  useEffect(() => {
    if (!token) {
      setError("Token is missing. Please check your invitation email.");
      setVerifying(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await axios.get(`/api/auth/verify-invite-token?token=${token}`);
        if (res.data.success) {
          setUserName(res.data.name);
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || "Invalid or expired link.");
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    // Check all requirements
    const allPassed = requirements.every(req => req.regex.test(password));
    if (!allPassed) {
      alert("Please meet all password requirements");
      return;
    }

    try {
      setSubmitting(true);
      const res = await axios.post("/api/auth/set-password", {
        token,
        password
      });

      if (res.data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/");
        }, 3000);
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to set password.");
    } finally {
      setSubmitting(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-card border border-destructive/20 p-8 rounded-2xl shadow-xl text-center"
        >
          <div className="bg-destructive/10 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <X className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Invalid Link</h1>
          <p className="text-muted-foreground mb-8">{error}</p>
          <Button onClick={() => router.push("/")} className="w-full h-12 rounded-xl">
            Return to Login
          </Button>
        </motion.div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-card border border-primary/20 p-8 rounded-2xl shadow-xl text-center"
        >
          <div className="bg-primary/10 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Password Set!</h1>
          <p className="text-muted-foreground mb-8">
            Your password has been set successfully. You will be redirected to the login page in a few seconds.
          </p>
          <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 3 }}
              className="h-full bg-primary"
            />
          </div>
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
          <h1 className="text-3xl font-black tracking-tight">Set Your Password</h1>
          <p className="text-muted-foreground mt-2">Welcome, {userName}. Let&apos;s secure your account.</p>
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
            disabled={submitting}
          >
            {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Complete Setup"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
