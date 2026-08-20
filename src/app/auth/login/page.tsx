"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import axios from "@/lib/axios";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Logo } from "@/components/school-os/logo";

export default function LoginPage() {
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [coldStartMsg, setColdStartMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("deactivated") === "true") {
        alert("Your account is deactivated!");
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      } else if (params.get("activated") === "true") {
        alert("Account activated successfully! You can now log in.");
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    }
  }, []);

  const loginImage = PlaceHolderImages.find(
    (image) => image.id === "login-background"
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  const handleLogin = async (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e && 'preventDefault' in e) e.preventDefault();
    
    if (!identifier || !password) {
      alert("Please enter your credentials.");
      return;
    }

    try {
      setLoading(true);
      console.log("=== LOGIN FLOW START ===");
      console.log("Browser Location Hostname:", typeof window !== "undefined" ? window.location.hostname : "unknown");
      console.log("Identifier/Email:", identifier);
      console.log("Axios resolved baseURL:", axios.defaults.baseURL);

      const res = await axios.post("/api/auth/login", {
        email: identifier.trim(),
        password,
      });

      console.log("Login API success response received:", res.status, res.data);

      if (!res.data?.success) {
        console.error("Login API returned success: false", res.data);
        alert(res.data?.message || "Login failed");
        return;
      }

      if (rememberMe) {
        localStorage.setItem("rememberedId", identifier);
      } else {
        localStorage.removeItem("rememberedId");
      }

      console.log("Setting localStorage/sessionStorage auth tokens...");
      localStorage.setItem("isAuthenticated", "true");
      sessionStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("accessToken", res.data.accessToken);
      localStorage.setItem("refreshToken", res.data.refreshToken);
      localStorage.setItem("role_id", String(res.data.role_id));
      localStorage.setItem("user_email", res.data.email || identifier);
      localStorage.setItem("user_name", res.data.name || res.data.full_name || "User");

      if (res.data.student_details) {
        localStorage.setItem("student_id", String(res.data.student_details.student_id));
        localStorage.setItem("class_id", String(res.data.student_details.class_id));
      }

      console.log("Redirecting user to /main/dashboard...");
      router.push("/main/dashboard");
    } catch (error: any) {
      console.error("=== LOGIN EXCEPTION CAUGHT ===");
      console.error("Error Message:", error.message);
      if (error.response) {
        console.error("HTTP Status:", error.response.status);
        console.error("Response Headers:", error.response.headers);
        console.error("Response Data:", error.response.data);
      } else if (error.request) {
        console.error("No HTTP response received. Request details:", error.request);
      } else {
        console.error("Axios setup/config error:", error.config);
      }
      console.error("Full Error Object:", error);

      const isColdStart = error?.response?.status === 503 && error?.response?.data?.cold_start;
      const isNetworkError = !error.response && (error.message === "Network Error" || error.code === "ECONNABORTED");

      if (isColdStart || isNetworkError) {
        setColdStartMsg("Server is waking up, retrying automatically...");
        // Auto-retry once after 3 seconds
        setTimeout(async () => {
          try {
            const retryRes = await axios.post("/api/auth/login", {
              email: identifier.trim(),
              password,
            });
            if (retryRes.data?.success) {
              setColdStartMsg(null);
              if (rememberMe) {
                localStorage.setItem("rememberedId", identifier);
              } else {
                localStorage.removeItem("rememberedId");
              }
              localStorage.setItem("isAuthenticated", "true");
              sessionStorage.setItem("isAuthenticated", "true");
              localStorage.setItem("accessToken", retryRes.data.accessToken);
              localStorage.setItem("refreshToken", retryRes.data.refreshToken);
              localStorage.setItem("role_id", String(retryRes.data.role_id));
              localStorage.setItem("user_email", retryRes.data.email || identifier);
              localStorage.setItem("user_name", retryRes.data.name || retryRes.data.full_name || "User");
              if (retryRes.data.student_details) {
                localStorage.setItem("student_id", String(retryRes.data.student_details.student_id));
                localStorage.setItem("class_id", String(retryRes.data.student_details.class_id));
              }
              router.push("/main/dashboard");
            } else {
              setColdStartMsg(null);
              alert(retryRes.data?.message || "Login failed after retry");
            }
          } catch (retryErr: any) {
            setColdStartMsg(null);
            const retryMessage = retryErr?.response?.data?.message ||
                                 "Server is still starting up. Please wait a moment and try again.";
            alert(retryMessage);
          } finally {
            setLoading(false);
          }
        }, 3000);
        return; // Don't setLoading(false) yet — the retry timer will handle it
      }

      const displayMessage = error?.response?.data?.message || 
                             error?.response?.data?.error || 
                             (error.message ? `Connection error: ${error.message}` : "Invalid credentials. Please try again.");
      alert(displayMessage);
    } finally {
      setLoading(false);
      console.log("=== LOGIN FLOW END ===");
    }
  };

  return (
    <div className="w-full min-h-[100dvh] lg:min-h-screen lg:grid lg:grid-cols-2 bg-[url('/auth-bg.svg')] bg-cover bg-center bg-no-repeat lg:bg-none lg:bg-background flex flex-col justify-center">
      {/* Left side: Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12 sm:px-6 lg:px-12 bg-transparent lg:bg-slate-50/50" style={{ paddingTop: 'max(2rem, env(safe-area-inset-top, 2rem))', paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 2rem))' }}>
        <motion.div 
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="mx-auto w-full max-w-[360px] sm:max-w-[400px] lg:max-w-[420px] bg-white sm:bg-white lg:bg-transparent p-6 sm:p-8 lg:p-0 rounded-[2.5rem] lg:rounded-none shadow-[0_20px_50px_rgba(30,64,175,0.08)] sm:shadow-xl lg:shadow-none border border-slate-100/90 lg:border-0 space-y-5 sm:space-y-7"
        >
          {/* Header section (Left-aligned as in reference image) */}
          <div className="flex flex-col items-start text-left">
            <div className="flex items-center justify-start mb-5">
              <Logo className="h-7 w-7" iconClassName="h-7 w-7 text-primary" textClassName="text-xl font-bold tracking-tight text-slate-900" />
            </div>
            <h1 className="text-2xl sm:text-[28px] lg:text-4xl font-extrabold tracking-tight text-slate-900 mb-1.5">
              Welcome back
            </h1>
            <p className="text-xs sm:text-sm lg:text-base text-slate-500 font-medium leading-relaxed max-w-[260px] sm:max-w-[320px] lg:max-w-none">
              Access your digital campus management system
            </p>
          </div>

          <div className="space-y-4 sm:space-y-5">
            <div className="space-y-3.5 sm:space-y-4">
              {/* Identity Field */}
              <div className="space-y-1.5">
                <Label htmlFor="identifier" className="text-xs font-bold text-slate-800 ml-1 block">
                  ID or Email
                </Label>
                <div className="relative group">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors pointer-events-none">
                    <User size={18} />
                  </div>
                  <Input
                    id="identifier"
                    type="text"
                    placeholder="Enter your student ID or email"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="h-13 lg:h-12 pl-11 pr-4 bg-[#F0F5FF]/90 lg:bg-white border-blue-100/70 lg:border-slate-200/80 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all rounded-2xl lg:rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between ml-1">
                  <Label htmlFor="password" className="text-xs font-bold text-slate-800">
                    Password
                  </Label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs font-semibold text-primary hover:underline active:opacity-75 transition-opacity"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative group">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors pointer-events-none">
                    <Lock size={18} />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="h-13 lg:h-12 pl-11 pr-11 bg-[#F0F5FF]/90 lg:bg-white border-blue-100/70 lg:border-slate-200/80 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all rounded-2xl lg:rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center select-none ml-1 pt-0.5">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
                className="h-4 w-4 rounded-md border-slate-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-transform active:scale-90"
              />
              <Label
                htmlFor="remember"
                className="text-xs font-medium text-slate-500 ml-2 cursor-pointer active:opacity-75"
              >
                Keep me signed in
              </Label>
            </div>

            <Button
              type="button"
              onClick={() => handleLogin()}
              className="w-full h-13 lg:h-12 text-sm sm:text-base font-bold bg-primary hover:bg-primary/90 text-white rounded-2xl lg:rounded-xl shadow-lg shadow-primary/25 active:scale-[0.98] transition-all"
              disabled={loading}
            >
              {coldStartMsg ? "Retrying..." : loading ? "Logging in..." : "Login"}
            </Button>

            {coldStartMsg && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center text-xs sm:text-sm font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl py-2 px-3"
              >
                ⏳ {coldStartMsg}
              </motion.p>
            )}
          </div>

          <p className="text-center text-xs text-slate-500 pt-0.5">
            Having trouble logging in? <Link href="/support" className="text-primary font-bold hover:underline active:opacity-75 transition-opacity">Contact Support</Link>
          </p>
        </motion.div>
      </div>

      {/* Right side: Branding/Visual */}
      <div className="hidden lg:block relative overflow-hidden">
        {loginImage && (
          <div className="absolute inset-0">
            <Image
              src={loginImage.imageUrl}
              alt="Campus"
              fill
              className="object-cover"
              priority
            />
          </div>
        )}
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]" />
        
        <div className="absolute bottom-16 left-16 right-16 z-10 text-white">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <h2 className="text-5xl font-black tracking-tight mb-4">SchoolOS</h2>
            <div className="h-1 w-24 bg-primary mb-6" />
            <p className="text-xl font-medium text-white/90 leading-relaxed max-w-lg">
              Streamlining educational workflows and fostering academic success through unified management tools.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
