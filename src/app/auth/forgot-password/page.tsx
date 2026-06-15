"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Loader2, Mail, Check } from "lucide-react";
import { motion } from "framer-motion";
import axios from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/campus-connect/logo";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await axios.post("/api/auth/forgot-password", { email });
      setSuccess(true);
      setMessage(res.data.message || "If this email exists, a reset link has been sent.");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="mb-8 text-center">
            <Logo className="h-12 w-12 mx-auto mb-4" />
            <h1 className="text-3xl font-black tracking-tight">Forgot Password?</h1>
            <p className="text-muted-foreground mt-2">No worries, we&apos;ll send you reset instructions.</p>
        </div>

        <div className="bg-card border p-8 rounded-2xl shadow-xl">
          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                  Email Address
                </Label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Mail size={18} />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-12 rounded-xl text-lg font-bold" disabled={loading}>
                {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : "Send Reset Link"}
              </Button>
            </form>
          ) : (
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="text-center py-4"
            >
              <div className="bg-primary/10 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2">Check your email</h2>
              <p className="text-muted-foreground mb-8">
                {message}
              </p>
              <Button onClick={() => router.push("/auth/login")} variant="outline" className="w-full h-12 rounded-xl">
                Back to Login
              </Button>
            </motion.div>
          )}

          {!success && (
            <div className="mt-6 text-center">
              <Link href="/auth/login" className="inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-primary transition-colors">
                <ChevronLeft size={16} className="mr-1" />
                Back to Login
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
