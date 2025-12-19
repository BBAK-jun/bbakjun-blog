"use client";

import { Toaster as SonnerToaster } from "sonner";
import { useTheme } from "next-themes";

export function Toaster() {
  const { theme } = useTheme();

  return (
    <SonnerToaster
      theme={theme as "light" | "dark" | "system"}
      position="top-right"
      expand={false}
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: "rounded-lg border shadow-lg",
          title: "text-sm font-medium",
          description: "text-sm opacity-90",
          success: "border-green-200 dark:border-green-800",
          error: "border-red-200 dark:border-red-800",
          warning: "border-yellow-200 dark:border-yellow-800",
          info: "border-blue-200 dark:border-blue-800",
        },
      }}
    />
  );
}
