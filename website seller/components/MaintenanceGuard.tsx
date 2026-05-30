"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

interface MaintenanceGuardProps {
  children: React.ReactNode;
}

export default function MaintenanceGuard({ children }: MaintenanceGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMaintenanceActive, setIsMaintenanceActive] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!db) {
      setIsLoaded(true);
      return;
    }

    const unsub = onSnapshot(doc(db, "settings", "config"), (snap) => {
      const active = snap.exists() && snap.data().maintenanceMode === true;
      setIsMaintenanceActive(active);
      setIsLoaded(true);

      const isAdminRoute = pathname.startsWith("/admin");
      const isMaintenanceRoute = pathname === "/maintenance";

      if (active && !isAdminRoute && !isMaintenanceRoute) {
        router.push("/maintenance");
      }
    });

    return () => unsub();
  }, [pathname, router]);

  const isAdminRoute = pathname.startsWith("/admin");
  const isMaintenanceRoute = pathname === "/maintenance";

  // Allow admin and maintenance routes through immediately
  if (isAdminRoute || isMaintenanceRoute) {
    return <>{children}</>;
  }

  // Prevent client page from flashing if we are under active maintenance
  if (isMaintenanceActive) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return <>{children}</>;
}
