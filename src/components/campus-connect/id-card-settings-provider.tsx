
"use client";

import * as React from "react";

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

  const handleSetSettings = (newSettings: IdCardSettings) => {
    setSettings(newSettings);
    if (typeof window !== "undefined") {
      localStorage.setItem("idCardSettings", JSON.stringify(newSettings));
    }
  };

  return (
    <IdCardSettingsContext.Provider value={{ settings, setSettings: handleSetSettings }}>
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
