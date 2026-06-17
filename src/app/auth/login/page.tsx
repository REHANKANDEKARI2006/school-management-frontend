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
import { Logo } from "@/components/campus-connect/logo";

export default function LoginPage() {
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

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

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!identifier || !password) {
      alert("Please enter your credentials.");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post("/api/auth/login", {
        email: identifier,
        password,
      });

      if (!res.data?.success) {
        alert(res.data?.message || "Login failed");
        return;
      }

      if (rememberMe) {
        localStorage.setItem("rememberedId", identifier);
      } else {
        localStorage.removeItem("rememberedId");
      }

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

      router.push("/main/dashboard");
    } catch (error: any) {
      alert(error?.response?.data?.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 bg-background">
      {/* Left side: Form */}
      <div className="flex items-center justify-center py-12 px-6 lg:px-12 bg-slate-50/50">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto w-full max-w-[420px] space-y-8"
        >
          <div className="text-left">
            <Logo className="h-10 w-10 mb-6" />
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
              Welcome back
            </h1>
            <p className="text-slate-500 font-medium">
              Access your digital campus management system
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-5">
              {/* Identity Field */}
              <div className="space-y-2">
                <Label htmlFor="identifier" className="text-sm font-semibold text-slate-700 ml-0.5">
                  ID or Email
                </Label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <User size={18} />
                  </div>
                  <Input
                    id="identifier"
                    type="text"
                    placeholder="Enter your student ID or email"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="h-12 pl-11 bg-white border-slate-200 shadow-sm focus:border-primary focus:ring-primary/10 transition-all rounded-xl"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between ml-0.5">
                  <Label htmlFor="password" className="text-sm font-semibold text-slate-700">
                    Password
                  </Label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative group">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock size={18} />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 pl-11 pr-11 bg-white border-slate-200 shadow-sm focus:border-primary focus:ring-primary/10 transition-all rounded-xl"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center select-none ml-0.5">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
                className="rounded border-slate-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <Label
                htmlFor="remember"
                className="text-sm font-medium text-slate-600 ml-2.5 cursor-pointer"
              >
                Keep me signed in
              </Label>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-bold bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500">
            Having trouble logging in? <Link href="#" className="text-primary font-semibold hover:underline">Contact Support</Link>
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
            <h2 className="text-5xl font-black tracking-tight mb-4">Campus Connect</h2>
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
