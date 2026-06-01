
"use client";

import * as React from "react";
import axios from "@/lib/axios";

export type IdCardConfig = {
  template_style: string;
  photo_style: "circle" | "square";
  header_color: string;
  footer_color: string;
  text_primary_color: string;
  bg_color: string;
  show_fields: {
    father_name: boolean;
    mother_name: boolean;
    blood_group: boolean;
    route: boolean;
    dob: boolean;
    emergency_contact: boolean;
  };
  footer_elements: {
    signature: boolean;
    stamp: boolean;
  };
};

export type IdCardSettings = {
  schoolName: string;
  slogan: string;
  logoUrl: string;
  schoolAddress: string;
  recognition: string;
  schoolPhone: string;
  organizationName?: string;
  primaryColor?: string;
  signatureUrl?: string;
  academicYear?: string;
  idCardConfig?: IdCardConfig;
};

type IdCardSettingsContextType = {
  settings: IdCardSettings;
  setSettings: (settings: IdCardSettings) => void;
};

const IdCardSettingsContext = React.createContext<
  IdCardSettingsContextType | undefined
>(undefined);

const defaultSettings: IdCardSettings = {
  schoolName: "CampusConnect University",
  slogan: "Excellence and Innovation",
  logoUrl: "/logo-placeholder.svg",
  schoolAddress: "123 University Drive, Knowledge City, ED 54321",
  recognition: "(Govt. Recognised)",
  schoolPhone: "+1-202-555-0123",
  organizationName: "",
  idCardConfig: {
    template_style: "template1",
    photo_style: "circle",
    header_color: "#437ef1",
    footer_color: "#437ef1",
    text_primary_color: "#0f172a",
    bg_color: "#ffffff",
    show_fields: {
      father_name: true,
      mother_name: false,
      blood_group: true,
      route: false,
      dob: true,
      emergency_contact: false
    },
    footer_elements: {
      signature: true,
      stamp: false
    }
  }
};


export function IdCardSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = React.useState<IdCardSettings>(() => {
    if (typeof window !== "undefined") {
      const savedSettings = localStorage.getItem("idCardSettings");
      return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
    }
    return defaultSettings;
  });

  // 🔄 Sync with Backend on Mount
  React.useEffect(() => {
    const syncWithBackend = async () => {
      try {
        const res = await axios.get("/api/school-profile");
        if (res.data.success && res.data.data) {
          const profile = res.data.data;
          setSettings(prev => {
             const mapped = {
                ...prev,
                schoolName: profile.school_name || prev.schoolName,
                schoolAddress: profile.address || prev.schoolAddress,
                schoolPhone: profile.phone || prev.schoolPhone,
                logoUrl: profile.logo_url || prev.logoUrl,
                slogan: profile.slogan || prev.slogan,
                organizationName: profile.organization_name || prev.organizationName,
                academicYear: profile.academic_year || prev.academicYear,
                signatureUrl: profile.signature_url || prev.signatureUrl,
                primaryColor: profile.primary_color || prev.primaryColor,
              };
              localStorage.setItem("idCardSettings", JSON.stringify(mapped));
              return mapped;
          });
        }
      } catch (error) {
        console.error("Failed to sync settings with backend:", error);
      }
    };

    syncWithBackend();
  }, []);

  const handleSetSettings = React.useCallback((newSettings: IdCardSettings) => {
    setSettings(newSettings);
    if (typeof window !== "undefined") {
      localStorage.setItem("idCardSettings", JSON.stringify(newSettings));
    }
  }, []);

  const contextValue = React.useMemo(() => ({
    settings,
    setSettings: handleSetSettings
  }), [settings, handleSetSettings]);

  return (
    <IdCardSettingsContext.Provider value={contextValue}>
      {children}
    </IdCardSettingsContext.Provider>
  );
}

export function useIdCardSettings() {
  const context = React.useContext(IdCardSettingsContext);
  if (context === undefined) {
    throw new Error("useIdCardSettings must be used within an IdCardSettingsProvider");
  }
  return context;
}
