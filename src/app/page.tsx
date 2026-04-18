"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, User, Chrome } from "lucide-react";
import axios from "@/lib/axios";
import { motion, AnimatePresence } from "framer-motion";

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
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Load remembered identifier on mount
  useEffect(() => {
    const savedId = localStorage.getItem("rememberedId");
    if (savedId) {
      setIdentifier(savedId);
      setRememberMe(true);
    }
  }, []);

  const loginImage = PlaceHolderImages.find(
    (image) => image.id === "login-background"
  );

  const handleLogin = async () => {
    if (!identifier || !password) {
      alert("Student ID/Email and password are required.");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post("/api/auth/login", {
        email: identifier, // Backend expects 'email'
        password,
      });

      if (!res.data?.success) {
        alert(res.data?.message || "Login failed");
        return;
      }

      // Handle Remember Me
      if (rememberMe) {
        localStorage.setItem("rememberedId", identifier);
      } else {
        localStorage.removeItem("rememberedId");
      }

      // Save tokens and session data
      localStorage.setItem("isAuthenticated", "true");
      sessionStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("accessToken", res.data.accessToken);
      localStorage.setItem("refreshToken", res.data.refreshToken);
      localStorage.setItem("role_id", String(res.data.role_id));
      localStorage.setItem("user_email", res.data.email || identifier);
      localStorage.setItem(
        "user_name",
        res.data.name || res.data.full_name || "User"
      );

      if (res.data.student_details) {
        localStorage.setItem("student_id", String(res.data.student_details.student_id));
        localStorage.setItem("class_id", String(res.data.student_details.class_id));
        if (res.data.student_details.section_id) {
          localStorage.setItem("section_id", String(res.data.student_details.section_id));
        }
      }

      router.push("/main/dashboard");
    } catch (error: any) {
      alert(
        error?.response?.data?.message ||
          "Invalid credentials. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full lg:grid lg:min-h-[100vh] lg:grid-cols-2 xl:min-h-[100vh] bg-background selection:bg-primary/20">
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-background via-background to-primary/5">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mx-auto grid w-full max-w-[400px] gap-8"
        >
          <div className="grid gap-2 text-center">
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="flex justify-center items-center gap-2 mb-2"
            >
              <Logo className="h-12 w-12" />
            </motion.div>
            <h1 className="text-4xl font-black font-headline tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 sm:text-5xl">
              Welcome Back
            </h1>
            <p className="text-muted-foreground text-sm font-medium">
              Access your digital campus experience
            </p>
          </div>

          <div className="grid gap-5">
            {/* Identity Field */}
            <div className="grid gap-2 relative">
              <Label htmlFor="identifier" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 ml-1">
                Student ID / Email
              </Label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                  <User size={18} />
                </div>
                <Input
                  id="identifier"
                  type="text"
                  placeholder="STU001 or rehan@example.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="h-12 pl-10 bg-muted/40 border-muted-foreground/10 shadow-sm transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="grid gap-2">
              <div className="flex items-center justify-between ml-1">
                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                  Password
                </Label>
                <button
                  type="button"
                  className="text-xs font-semibold text-muted-foreground/60 hover:text-primary transition-colors cursor-not-allowed"
                  disabled
                  title="Feature coming soon"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                  <Lock size={18} />
                </div>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 px-10 bg-muted/40 border-muted-foreground/10 shadow-sm transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <AnimatePresence mode="wait">
                    {showPassword ? (
                      <motion.div
                        key="eye-off"
                        initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        exit={{ opacity: 0, scale: 0.5, rotate: 45 }}
                        transition={{ duration: 0.15 }}
                      >
                        <EyeOff size={18} />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="eye"
                        initial={{ opacity: 0, scale: 0.5, rotate: 45 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        exit={{ opacity: 0, scale: 0.5, rotate: -45 }}
                        transition={{ duration: 0.15 }}
                      >
                        <Eye size={18} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <motion.div 
              whileTap={{ scale: 0.98 }}
              className="flex items-center space-x-2 py-1 select-none"
            >
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
                className="data-[state=checked]:bg-primary rounded-[4px]"
              />
              <Label
                htmlFor="remember"
                className="text-sm font-semibold text-muted-foreground/80 cursor-pointer"
              >
                Keep me signed in
              </Label>
            </motion.div>

            {/* Login Button */}
            <div className="grid gap-3 pt-2">
              <Button
                type="button"
                className="w-full h-14 text-lg font-bold shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] bg-primary hover:bg-primary/90 rounded-xl group relative overflow-hidden"
                onClick={handleLogin}
                loading={loading}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent transition-transform duration-500 -translate-x-full group-hover:translate-x-full" />
                <span className="relative z-10">
                  {loading ? "Authenticating..." : "Sign In"}
                </span>
              </Button>

              <Button 
                variant="outline" 
                className="w-full h-14 text-sm font-bold border-muted-foreground/10 hover:bg-muted/50 rounded-xl transition-all cursor-not-allowed opacity-60" 
                disabled
              >
                <Chrome className="mr-2 h-5 w-5" />
                Continue with Google
              </Button>
            </div>
          </div>

          <div className="mt-2 text-center text-sm font-medium text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="#" className="font-bold text-primary hover:text-primary/80 transition-all underline decoration-2 underline-offset-4">
              Contact Admin
            </Link>
          </div>
        </motion.div>
      </div>

      <div className="hidden bg-muted lg:block relative overflow-hidden group">
        <AnimatePresence>
          {loginImage && (
            <motion.div
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.5 }}
              className="absolute inset-0"
            >
              <Image
                src={loginImage.imageUrl}
                alt="School Campus"
                fill
                className="object-cover transition-transform duration-[10s] group-hover:scale-110"
                priority
              />
            </motion.div>
          )}
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-primary/40 via-background/20 to-transparent mix-blend-multiply" />
        <div className="absolute inset-0 backdrop-blur-[2px] backdrop-saturate-150" />
        
        <div className="absolute bottom-12 left-12 right-12 z-10 text-white">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
          >
            <h2 className="text-4xl font-extrabold tracking-tight mb-2">Campus Connect</h2>
            <p className="text-xl font-medium text-white/80 max-w-md">
              Your gateway to academic excellence and seamless school management.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
