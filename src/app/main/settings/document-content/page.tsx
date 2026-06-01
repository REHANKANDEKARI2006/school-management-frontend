"use client";

import React from "react";
import { FileText, Settings as SettingsIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { ROLE } from "@/config/roles";
import Link from "next/link";

export default function DocumentContentManagerPage() {
  useRoleGuard([ROLE.MASTER_ADMIN, ROLE.IT_SUPPORT]);

  return (
    <div className="min-h-screen bg-slate-50/50 pb-10">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-8 pb-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 text-sm font-medium text-slate-500">
              <Link href="/main/settings" className="hover:text-primary transition-colors flex items-center gap-1">
                <SettingsIcon className="h-4 w-4" />
                Settings
              </Link>
              <span>/</span>
              <span className="text-emerald-600 font-semibold">Document Content Manager</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <FileText className="h-6 w-6 text-emerald-600" />
              </div>
              Document Content Manager
            </h1>
            <p className="text-sm text-slate-500 mt-2">
              Manage dynamic content, translations, and placeholders for certificates.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-12 mt-6">
        <Card className="shadow-sm border-slate-100 rounded-xl overflow-hidden mb-8">
          <CardHeader className="bg-slate-50/50 border-b p-6">
            <CardTitle className="text-lg font-bold text-slate-800">Content Configuration</CardTitle>
            <CardDescription className="text-sm">
              This module is currently under development. Soon you will be able to manage all document content here.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-12 flex flex-col items-center justify-center text-center">
            <div className="h-20 w-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <FileText className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-700">Coming Soon</h3>
            <p className="text-slate-500 max-w-md mt-2">
              The Document Content Manager is currently being built. Check back in a future update to manage placeholders, custom fields, and document translations.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
