"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, X, Lock, Eye, EyeOff, Loader2, ArrowRight, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/campus-connect/logo";

// ── Inner component (uses useSearchParams — must be inside Suspense) ────────

function SetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [verifying, setVerifying]     = useState(true);
  const [error, setError]             = useState("");
  const [userName, setUserName]       = useState("");
  const [userEmail, setUserEmail]     = useState("");
  const [password, setPassword]       = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword]       = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [success, setSuccess]         = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [formError, setFormError]     = useState("");
  const [isExpired, setIsExpired]     = useState(false);

  // Password strength requirements
  const requirements = [
    { label: "At least 8 characters",       regex: /.{8,}/ },
    { label: "At least one uppercase letter", regex: /[A-Z]/ },
    { label: "At least one number",          regex: /[0-9]/ },
    { label: "At least one special character", regex: /[!@#$%^&*(),.?":{}|<>]/ },
  ];

  // ── Verify token on mount ──────────────────────────────────────────────

  useEffect(() => {
    if (!token) {
      setError("Invitation token is missing. Please click the link from your email again.");
      setVerifying(false);
      return;
    }

    const verify = async () => {
      try {
        const res = await axios.get(`/api/auth/verify-invite-token?token=${token}`);
        if (res.data.success) {
          setUserName(res.data.name || "");
          setUserEmail(res.data.email || "");
        } else {
          setError(res.data.message || "This invitation link is invalid or has expired.");
          setIsExpired(res.data.isExpired || false);
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || "This invitation link is invalid or has expired.");
        setIsExpired(err?.response?.data?.isExpired || false);
      } finally {
        setVerifying(false);
      }
    };

    verify();
  }, [token]);

  // ── Submit ─────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (password !== confirmPassword) {
      setFormError("Passwords do not match. Please try again.");
      return;
    }

    const allPassed = requirements.every((req) => req.regex.test(password));
    if (!allPassed) {
      setFormError("Please meet all password requirements before continuing.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await axios.post("/api/auth/set-password", { token, password });
      if (res.data.success) {
        setSuccess(true);
      }
    } catch (err: any) {
      setFormError(err?.response?.data?.message || "Failed to set password. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── States ─────────────────────────────────────────────────────────────

  if (verifying) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Verifying your invitation link…</p>
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
          <h1 className="text-2xl font-bold mb-3">{isExpired ? "Link Expired" : "Link Invalid"}</h1>
          <p className="text-muted-foreground text-sm mb-8 leading-relaxed">{error}</p>
          <Button onClick={() => router.push("/auth/login")} className="w-full h-12 rounded-xl">
            Go to Login
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
          {/* Success icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 250, delay: 0.1 }}
            className="bg-emerald-100 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <ShieldCheck className="h-10 w-10 text-emerald-600" />
          </motion.div>

          <h1 className="text-2xl font-bold mb-2">Account Activated!</h1>
          <p className="text-muted-foreground text-sm mb-2">
            Your password has been set successfully.
          </p>
          {userEmail && (
            <p className="text-sm font-medium text-slate-700 bg-slate-100 rounded-lg px-4 py-2 inline-block mb-6">
              {userEmail}
            </p>
          )}
          <p className="text-muted-foreground text-sm mb-8">
            You can now log in using your email and the password you just created.
          </p>

          <Button
            className="w-full h-12 rounded-xl gap-2 text-base font-semibold"
            onClick={() => router.push("/auth/login")}
          >
            Go to Login
            <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>
      </div>
    );
  }

  // ── Main form ──────────────────────────────────────────────────────────

  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <Logo className="h-12 w-12 mx-auto mb-4" />
          <h1 className="text-3xl font-black tracking-tight">Set Your Password</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Welcome, <span className="font-semibold text-foreground">{userName}</span>.
            Create a strong password to secure your account.
          </p>
        </div>

        {/* Form card */}
        <form onSubmit={handleSubmit} className="bg-card border p-8 rounded-2xl shadow-xl space-y-5">

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-semibold">
              New Password
            </Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Lock size={16} />
              </div>
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9 pr-10 h-11"
                placeholder="Create a strong password"
                required
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirm-password" className="text-sm font-semibold">
              Confirm Password
            </Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Lock size={16} />
              </div>
              <Input
                id="confirm-password"
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`pl-9 pr-10 h-11 transition-colors ${
                  passwordsMismatch
                    ? "border-red-400 focus:ring-red-300"
                    : passwordsMatch
                    ? "border-emerald-400 focus:ring-emerald-300"
                    : ""
                }`}
                placeholder="Re-enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <AnimatePresence>
              {passwordsMismatch && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-xs text-red-500 font-medium flex items-center gap-1"
                >
                  <X size={12} /> Passwords do not match
                </motion.p>
              )}
              {passwordsMatch && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-xs text-emerald-600 font-medium flex items-center gap-1"
                >
                  <Check size={12} /> Passwords match
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Requirements checklist */}
          <div className="bg-muted/40 rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Password Requirements
            </p>
            {requirements.map((req, i) => {
              const passed = req.regex.test(password);
              return (
                <div key={i} className="flex items-center gap-2.5 text-sm">
                  {passed ? (
                    <div className="h-4 w-4 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                      <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                    </div>
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/20 flex-shrink-0" />
                  )}
                  <span className={passed ? "text-emerald-700 font-medium" : "text-muted-foreground"}>
                    {req.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Form-level error */}
          <AnimatePresence>
            {formError && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm"
              >
                <X className="h-4 w-4 mt-0.5 flex-shrink-0" />
                {formError}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit button */}
          <Button
            type="submit"
            className="w-full h-12 rounded-xl text-base font-bold gap-2"
            disabled={submitting || passwordsMismatch}
          >
            {submitting ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Setting password…</>
            ) : (
              <>Activate My Account <ArrowRight className="h-4 w-4" /></>
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Already have a password?{" "}
            <button
              type="button"
              onClick={() => router.push("/auth/login")}
              className="text-primary hover:underline font-medium"
            >
              Sign in
            </button>
          </p>
        </form>
      </motion.div>
    </div>
  );
}

// ── Page wrapper (required because useSearchParams needs Suspense) ───────────

export default function SetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <SetPasswordForm />
    </Suspense>
  );
}
