import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parseISO, isValid } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Standardized Date Formatter for the entire system.
 * Requirement: DD/MM/YYYY (e.g., 05/05/2026)
 */
export function formatDate(date: string | number | Date | null | undefined): string {
  if (!date) return "—";
  
  try {
    const d = typeof date === "string" ? parseISO(date) : new Date(date);
    
    // If parseISO fails or returns invalid date, try native Date constructor
    const finalDate = isValid(d) ? d : new Date(date);
    
    if (!isValid(finalDate)) return "—";
    
    return format(finalDate, "dd/MM/yyyy");
  } catch (error) {
    console.error("formatDate error:", error);
    return "—";
  }
}
