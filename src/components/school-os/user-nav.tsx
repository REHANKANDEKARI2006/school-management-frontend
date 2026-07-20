"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import axios from "@/lib/axios";


import { LogOut, User, Settings, ShieldCheck } from "lucide-react";
import { ROLE } from "@/config/roles";

export function UserNav() {
  const router = useRouter();

  const [name, setName] = useState("User");
  const [email, setEmail] = useState("user@demo.com");
  const [profileUrl, setProfileUrl] = useState<string | null>(null);
  const [roleId, setRoleId] = useState<number | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get("/api/auth/profile");
        if (res.data.success) {
          const { name, email, profile_url, role_id } = res.data.data;
          setName(name);
          setEmail(email);
          setProfileUrl(profile_url);
          setRoleId(Number(role_id));
          
          localStorage.setItem("user_name", name);
          localStorage.setItem("user_email", email);
          if (profile_url) localStorage.setItem("profile_url", profile_url);
          if (res.data.data.staff_id) localStorage.setItem("staff_id", res.data.data.staff_id);
        }
      } catch (error) {
        console.error("Failed to fetch profile", error);
        const storedName = localStorage.getItem("user_name");
        const storedEmail = localStorage.getItem("user_email");
        const storedAvatar = localStorage.getItem("profile_url");
        if (storedName) setName(storedName);
        if (storedEmail) setEmail(storedEmail);
        if (storedAvatar) setProfileUrl(storedAvatar);
      }
    };

    fetchProfile();

    // Listen for profile updates
    window.addEventListener("profileUpdated", fetchProfile);
    return () => window.removeEventListener("profileUpdated", fetchProfile);
  }, []);

  const handleLogout = () => {
    // 🔐 Clear auth data
    localStorage.clear();
    sessionStorage.clear();

    router.replace("/");
  };

  // Avatar initials (Admin User → AU)
  const initials = name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-9 w-9 rounded-full p-0 ring-offset-background transition-all hover:ring-2 hover:ring-primary/20 focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          <Avatar className="h-9 w-9 border-2 border-background shadow-sm">
            <AvatarImage
              src={profileUrl ?? undefined}
              alt={name}
              className="object-cover"
              crossOrigin="anonymous"
              referrerPolicy="no-referrer"
            />
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {email}
            </p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push("/main/profile")}>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>

          {roleId === ROLE.MASTER_ADMIN && (
            <DropdownMenuItem onClick={() => router.push("/main/user-management/admins")}>
              <ShieldCheck className="mr-2 h-4 w-4" />
              <span>Manage Admins</span>
            </DropdownMenuItem>
          )}

          {roleId !== 18 && (
            <DropdownMenuItem onClick={() => router.push("/main/profile/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4 text-red-500" />
          <span className="text-red-500">Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
