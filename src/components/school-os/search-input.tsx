"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSearch } from "@/components/school-os/search-provider";

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

      {/* Mobile: collapsed icon button OR full native header overlay bar */}
      <div className="flex md:hidden items-center">
        {mobileOpen ? (
          <div className="absolute inset-0 z-50 bg-white dark:bg-slate-900 px-3 sm:px-4 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="relative flex-1 flex items-center">
              <Search className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
              <Input
                type="search"
                autoFocus
                placeholder="Search..."
                className="w-full rounded-xl bg-slate-100/80 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 pl-10 pr-9 h-10 text-xs sm:text-sm font-medium focus-visible:ring-1 focus-visible:ring-indigo-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-10 text-xs font-bold text-indigo-600 dark:text-indigo-400 px-3 shrink-0 rounded-xl hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors"
              onClick={() => {
                setMobileOpen(false);
                setSearchQuery("");
              }}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-slate-600 dark:text-slate-300"
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
