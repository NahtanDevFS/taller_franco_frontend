"use client";

import Link from "next/link";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { Menu } from "lucide-react";

const navItems = [
  { label: "Home", href: "/dashboard" },
  { label: "Productos", href: "/productos" },
  { label: "Baterías Vendidas", href: "/venta-baterias" },
];

export default function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <aside className="h-screen w-64 bg-white border-r shadow-sm hidden md:flex flex-col">
      <div className="flex items-center justify-center h-16 border-b">
        <span className="text-xl font-bold text-blue-800">Taller Franco</span>
      </div>
      <nav className="flex-1 p-4 flex flex-col gap-2">
        {navItems.map((item, idx) => (
          <Link
            key={item.href}
            href={item.href}
            className="px-4 py-2 rounded-md text-slate-700 hover:bg-blue-50 hover:text-blue-800 transition-colors font-medium"
          >
            {item.label}
          </Link>
        ))}
        <Separator className="my-4" />
      </nav>
    </aside>
  );
}

// Sidebar responsive para móviles
export function SidebarMobile() {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="md:hidden p-2 text-blue-800">
          <Menu className="h-6 w-6" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-64">
        <div className="flex items-center justify-center h-16 border-b">
          <span className="text-xl font-bold text-blue-800">Taller Franco</span>
        </div>
        <nav className="flex-1 p-4 flex flex-col gap-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-4 py-2 rounded-md text-slate-700 hover:bg-blue-50 hover:text-blue-800 transition-colors font-medium"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <Separator className="my-4" />
        </nav>
      </SheetContent>
    </Sheet>
  );
}
