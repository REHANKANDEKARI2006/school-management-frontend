"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSearch } from "@/components/campus-connect/search-provider";

export function SearchInput() {
  const { searchQuery, setSearchQuery } = useSearch();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop search — always visible on md+ */}
      <div className="relative hidden md:flex flex-1 md:grow-0">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          type="search"
          placeholder="Search..."
          className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Mobile: collapsed icon OR expanded input */}
      <div className="flex md:hidden items-center">
        {mobileOpen ? (
          <div className="flex items-center gap-1">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                autoFocus
                placeholder="Search..."
                className="w-44 rounded-lg bg-background pl-8 h-9 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={() => {
                setMobileOpen(false);
                setSearchQuery("");
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setMobileOpen(true)}
            aria-label="Open search"
          >
            <Search className="h-4 w-4" />
          </Button>
        )}
      </div>
    </>
  );
}
