"use client";

import { usePathname } from "next/navigation";
import Sidebar, { SidebarMobile } from "@/components/Sidebar";

// Rutas públicas donde NO debe aparecer el sidebar
const publicRoutes = ["/login", "/register", "/"];

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isPublicRoute = publicRoutes.includes(pathname);

  if (isPublicRoute) {
    // Para rutas públicas (login, register, etc.) - sin sidebar
    return <main>{children}</main>;
  }

  // Para rutas protegidas (dashboard, productos, etc.) - con sidebar
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <div className="md:hidden p-2">
          <SidebarMobile />
        </div>
        <main className="flex-1 p-4">{children}</main>
      </div>
    </div>
  );
}
