
"use client";

import * as React from "react";

export type IdCardSettings = {
  schoolName: string;
  slogan: string;
  logoUrl: string;
  schoolAddress: string;
  recognition: string;
  schoolPhone: string;
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
  schoolPhone: "+1-202-555-0123"
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
