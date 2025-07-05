"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si el usuario está autenticado
    if (!authService.isAuthenticated()) {
      router.push("/login");
      return;
    }

    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto"></div>
          <p className="mt-4 text-slate-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Dashboard - Taller Franco" />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-2 sm:px-6 lg:px-8">
        <div className="px-2 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Card de Bienvenida */}
            <Card className="col-span-full">
              <CardHeader>
                <CardTitle className="text-blue-800 text-lg sm:text-xl">
                  ¡Bienvenido al Sistema de Gestión de Taller Franco!
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm sm:text-base">
                  Has iniciado sesión correctamente.
                </p>
                <p className="text-gray-600 text-sm sm:text-base mt-2">
                  Aquí puedes ver los productos que hay, modificarlos, agregar
                  nuevos o eliminar los que ya no están.
                </p>
                <p className="text-gray-600 text-sm sm:text-base mt-2">
                  Aquí puedes ver las baterías vendidas, modificarlas, agregar
                  nuevas o eliminar las que se devolvieron por garantía.
                </p>
                <p className="text-gray-600 text-sm sm:text-base mt-2">
                  Aquí puedes calcular el precio de venta de un producto.
                </p>
              </CardContent>
            </Card>

            {/* Estadísticas */}
            {/*
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Vehículos en Taller</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-blue-600">12</p>
                <p className="text-sm text-gray-500">En reparación</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Citas Hoy</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-orange-600">8</p>
                <p className="text-sm text-gray-500">Programadas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ingresos del Mes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-600">$45,230</p>
                <p className="text-sm text-gray-500">Total facturado</p>
              </CardContent>
            </Card>
            */}
          </div>
        </div>
      </main>
    </div>
  );
}
