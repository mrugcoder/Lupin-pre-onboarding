"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  // Guard ensures the auth check only runs ONCE per layout mount,
  // regardless of how many times the component re-renders or how many
  // times the Next.js router object changes reference during navigation.
  const authChecked = useRef(false);

  useEffect(() => {
    if (authChecked.current) return; // Already ran — skip on re-fires
    authChecked.current = true;

    if (!isAuthenticated()) {
      router.replace("/login");
    } else {
      setChecked(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty array: only run on initial mount, NOT on every navigation

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #050d1a 0%, #0f2040 50%, #162d58 100%)" }}>
        <div className="flex flex-col items-center gap-3">
          <svg
            className="animate-spin w-8 h-8"
            style={{ color: "#2dd4bf" }}
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
          <span className="text-slate-500 text-sm">Verifying session…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-brand-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 animate-fade-in">{children}</div>
      </main>
    </div>
  );
}
