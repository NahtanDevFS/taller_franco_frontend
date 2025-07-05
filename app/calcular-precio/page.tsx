"use client";

import React, { useEffect, useState } from "react";
import { authService } from "@/lib/auth";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import Header from "@/components/Header";

export default function CalcularPrecioPage() {
  const router = useRouter();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [costo, setCosto] = useState(0);
  const [precio, setPrecio] = useState(0);
  const [precioFinal, setPrecioFinal] = useState(0);

  useEffect(() => {
    if (costo <= 0) {
      setError("El costo del producto debe ser mayor a 0");
      setPrecio(0);
      setPrecioFinal(0);
      return;
    } else {
      setError("");
      //se debe calcular el precio del producto usando la misma variable para todos los useState, de lo contrario no se actualizarán correctamente
      //por ejemplo, si se calcula el precioProducto y se guarda en precio, y luego se calcula el precioFinal con el precio del useState precio, el precioFinal no se actualizará correctamente
      const precioProducto = costo * 1.35 + 20;
      setPrecio(precioProducto);

      // Calcular precioFinal usando el precio calculado
      if (precioProducto % 10 !== 0) {
        setPrecioFinal(precioProducto + (10 - (precioProducto % 10)));
      } else {
        setPrecioFinal(precioProducto);
      }
    }
  }, [costo]);

  useEffect(() => {
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
    <Card className="w-full py-0 shadow-lg border-0 border-blue-200 bg-white">
      <Header title="Gestión de Productos - Taller Franco" />
      <CardHeader className="space-y-1 p-2 bg-gradient-to-r from-blue-800 to-blue-900 text-white rounded-t-lg">
        <CardTitle className="text-2xl font-bold text-center">
          Calcular Precio
        </CardTitle>
        <CardDescription className="text-lg text-center text-white">
          Ingresa el costo del producto para calcular el precio de venta
        </CardDescription>
      </CardHeader>
      <CardContent className="bg-white py-6">
        <form className="space-y-4">
          {error && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-md text-yellow-700">{error}</p>
            </div>
          )}
          <div className="space-y-4 mb-6">
            <Label
              htmlFor="costo"
              className="text-slate-800 text-md font-medium"
            >
              Costo del producto
            </Label>
            <div className="relative">
              <p className="absolute left-3 text-xl font-bold h-4 w-4 text-blue-700">
                Q
              </p>
              <input
                id="costo"
                type="number"
                min="1"
                placeholder="0.00"
                className="pl-10 border-2 text-lg border-slate-200 focus:border-blue-700 focus:ring-blue-700"
                onChange={(e) => setCosto(Number(e.target.value))}
                required
                disabled={loading}
              ></input>
            </div>
          </div>
          <div className="space-y-2 mb-8">
            <Label
              htmlFor="costo"
              className="text-slate-800 text-md font-medium"
            >
              Precio sin aproximar
            </Label>
            <div className="relative">
              <p className="absolute left-3 text-xl font-bold h-4 w-4 text-blue-700">
                Q
              </p>
              <p className="pl-10 text-xl font-bold h-4 w-4 text-blue-700">
                {precio.toFixed(2)}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="costo"
              className="text-slate-800 text-md font-medium"
            >
              Precio final
            </Label>
            <div className="relative">
              <p className="absolute left-3 text-xl font-bold h-4 w-4 text-blue-700">
                Q
              </p>
              <p className="pl-10 text-xl font-bold h-4 w-4 text-blue-700">
                {precioFinal.toFixed(2)}
              </p>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
