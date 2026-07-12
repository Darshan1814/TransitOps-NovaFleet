import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number, decimals: number = 2): string {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: decimals,
  }).format(num);
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function daysUntil(date: Date | string): number {
  const target = new Date(date);
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    AVAILABLE: "status-available",
    ON_TRIP: "status-on-trip",
    IN_SHOP: "status-in-shop",
    RETIRED: "status-retired",
    OFF_DUTY: "status-in-shop",
    SUSPENDED: "status-suspended",
    DRAFT: "status-draft",
    DISPATCHED: "status-dispatched",
    COMPLETED: "status-completed",
    CANCELLED: "status-cancelled",
    PENDING: "status-pending",
    APPROVED: "status-approved",
    REJECTED: "status-rejected",
    OPEN: "status-pending",
    IN_PROGRESS: "status-on-trip",
    CLOSED: "status-completed",
  };
  return map[status] ?? "status-draft";
}

export const roleLabels: Record<string, string> = {
  FLEET_MANAGER: "Fleet Manager",
  DRIVER: "Driver",
  SAFETY_OFFICER: "Safety Officer",
  FINANCIAL_ANALYST: "Financial Analyst",
  ADMIN: "Admin",
};

export const rolePaths: Record<string, string> = {
  FLEET_MANAGER: "/dashboard/fleet",
  DRIVER: "/dashboard/driver",
  SAFETY_OFFICER: "/dashboard/safety",
  FINANCIAL_ANALYST: "/dashboard/finance",
  ADMIN: "/dashboard/admin",
};

export const roleThemeNames: Record<string, string> = {
  FLEET_MANAGER: "Mission Control",
  DRIVER: "Cockpit",
  SAFETY_OFFICER: "Watchtower",
  FINANCIAL_ANALYST: "Ledger Deck",
  ADMIN: "The Tower",
};
