"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/auth";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
//import { Plus, Edit, Trash2, Save, X } from "lucide-react";
import { Plus, Edit, Trash2, Save } from "lucide-react";
import Swal from "sweetalert2";

interface VentaBateria {
  id_venta_bateria: number;
  codigo_bateria: string;
  id_producto: number;
  fecha_venta: string;
  garantia: string;
  comprador: string | null;
}

interface Producto {
  id_producto: number;
  codigo_producto: string | null;
  nombre_producto: string | null;
  descripcion_producto: string | null;
  id_categoria_producto: number | null;
  stock_producto: number | null;
  stock_minimo_producto: number | null;
  precio_producto: string | null;
  foto1_producto: string | null;
  foto2_producto: string | null;
  id_marca_producto: number | null;
}

interface VentaBateriaForm {
  codigo_bateria: string;
  id_producto: string;
  fecha_venta: string;
  garantia: string;
  comprador: string;
}

export default function VentaBateriasPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [ventasBaterias, setVentasBaterias] = useState<VentaBateria[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [confirmCreateDialogOpen, setConfirmCreateDialogOpen] = useState(false);
  const [confirmEditDialogOpen, setConfirmEditDialogOpen] = useState(false);
  const [selectedVentaBateria, setSelectedVentaBateria] =
    useState<VentaBateria | null>(null);
  const [formData, setFormData] = useState<VentaBateriaForm>({
    codigo_bateria: "",
    id_producto: "",
    fecha_venta: "",
    garantia: "",
    comprador: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push("/login");
      return;
    }
    fetchVentasBaterias();
    fetchProductos();
    setLoading(false);
  }, [router]);

  const fetchVentasBaterias = async () => {
    try {
      const res = await fetch(
        "https://taller-franco-backend.vercel.app/api/venta_baterias"
      );
      const data = await res.json();
      console.log("Ventas de baterías:", data);
      setVentasBaterias(data);
    } catch (error) {
      console.error("Error al obtener ventas de baterías:", error);
    }
  };

  const fetchProductos = async () => {
    try {
      // Aquí necesitarías un endpoint que filtre productos por categoría de baterías
      // Por ahora obtendremos todos los productos y los filtraremos en el frontend
      const res = await fetch(
        "https://taller-franco-backend.vercel.app/api/productos"
      );
      const data = await res.json();
      console.log("Productos:", data);
      setProductos(data);
    } catch (error) {
      console.error("Error al obtener productos:", error);
    }
  };

  // Filtrar solo productos que son baterías
  const productosBaterias = productos.filter(
    (producto) => producto.id_categoria_producto === 3 // ID de la categoría de baterías de carro
  );

  const getProductoInfo = (idProducto: number) => {
    const producto = productos.find((p) => p.id_producto === idProducto);
    return producto
      ? {
          codigo: producto.codigo_producto || "Sin código",
          nombre: producto.nombre_producto || "Sin nombre",
        }
      : { codigo: "No encontrado", nombre: "No encontrado" };
  };

  const resetForm = () => {
    setFormData({
      codigo_bateria: "",
      id_producto: "",
      fecha_venta: "",
      garantia: "",
      comprador: "",
    });
  };

  const handleInputChange = (field: keyof VentaBateriaForm, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateVentaBateria = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(
        "https://taller-franco-backend.vercel.app/api/venta_baterias",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            codigo_bateria: formData.codigo_bateria,
            id_producto: parseInt(formData.id_producto),
            fecha_venta: formData.fecha_venta,
            garantia: formData.garantia,
            comprador: formData.comprador || null,
          }),
        }
      );

      if (res.ok) {
        const newVentaBateria = await res.json();
        setVentasBaterias((prev) => [...prev, newVentaBateria]);
        setConfirmCreateDialogOpen(false);
        setDialogOpen(false);
        resetForm();
        Swal.fire({
          icon: "success",
          title: "¡Éxito!",
          text: "Venta de batería registrada exitosamente",
          confirmButtonColor: "#3085d6",
          confirmButtonText: "Aceptar",
        });
      } else {
        const errorData = await res.json();
        Swal.fire({
          icon: "error",
          title: "Error",
          text: errorData.error,
          confirmButtonColor: "#d33",
          confirmButtonText: "Aceptar",
        });
      }
    } catch (error) {
      console.error("Error al crear venta de batería:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error al registrar la venta de batería",
        confirmButtonColor: "#d33",
        confirmButtonText: "Aceptar",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditVentaBateria = async () => {
    if (!selectedVentaBateria) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(
        `https://taller-franco-backend.vercel.app/api/venta_baterias/${selectedVentaBateria.id_venta_bateria}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            codigo_bateria: formData.codigo_bateria,
            id_producto: parseInt(formData.id_producto),
            fecha_venta: formData.fecha_venta,
            garantia: formData.garantia,
            comprador: formData.comprador || null,
          }),
        }
      );

      if (res.ok) {
        const updatedVentaBateria = await res.json();
        setVentasBaterias((prev) =>
          prev.map((v) =>
            v.id_venta_bateria === selectedVentaBateria.id_venta_bateria
              ? updatedVentaBateria
              : v
          )
        );
        setConfirmEditDialogOpen(false);
        setEditDialogOpen(false);
        setSelectedVentaBateria(null);
        resetForm();
        Swal.fire({
          icon: "success",
          title: "¡Éxito!",
          text: "Venta de batería actualizada exitosamente",
          confirmButtonColor: "#3085d6",
          confirmButtonText: "Aceptar",
        });
      } else {
        const errorData = await res.json();
        Swal.fire({
          icon: "error",
          title: "Error",
          text: errorData.error,
          confirmButtonColor: "#d33",
          confirmButtonText: "Aceptar",
        });
      }
    } catch (error) {
      console.error("Error al actualizar venta de batería:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error al actualizar la venta de batería",
        confirmButtonColor: "#d33",
        confirmButtonText: "Aceptar",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteVentaBateria = async () => {
    if (!selectedVentaBateria) return;

    try {
      const res = await fetch(
        `https://taller-franco-backend.vercel.app/api/venta_baterias/${selectedVentaBateria.id_venta_bateria}`,
        {
          method: "DELETE",
        }
      );

      if (res.ok) {
        setVentasBaterias((prev) =>
          prev.filter(
            (v) => v.id_venta_bateria !== selectedVentaBateria.id_venta_bateria
          )
        );
        setSelectedVentaBateria(null);
        Swal.fire({
          icon: "success",
          title: "¡Éxito!",
          text: "Venta de batería eliminada exitosamente",
          confirmButtonColor: "#3085d6",
          confirmButtonText: "Aceptar",
        });
      } else {
        const errorData = await res.json();
        Swal.fire({
          icon: "error",
          title: "Error",
          text: errorData.error,
          confirmButtonColor: "#d33",
          confirmButtonText: "Aceptar",
        });
      }
    } catch (error) {
      console.error("Error al eliminar venta de batería:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error al eliminar la venta de batería",
        confirmButtonColor: "#d33",
        confirmButtonText: "Aceptar",
      });
    }
  };

  const openEditDialog = (ventaBateria: VentaBateria) => {
    setSelectedVentaBateria(ventaBateria);
    setFormData({
      codigo_bateria: ventaBateria.codigo_bateria,
      id_producto: ventaBateria.id_producto.toString(),
      fecha_venta: ventaBateria.fecha_venta,
      garantia: ventaBateria.garantia,
      comprador: ventaBateria.comprador || "",
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = async (ventaBateria: VentaBateria) => {
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: `¿Quieres eliminar la venta de batería "${ventaBateria.codigo_bateria}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      setSelectedVentaBateria(ventaBateria);
      handleDeleteVentaBateria();
    }
  };

  const showCreateConfirmation = () => {
    setConfirmCreateDialogOpen(true);
  };

  const showEditConfirmation = () => {
    setConfirmEditDialogOpen(true);
  };

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
      <Header title="Gestión de Ventas de Baterías - Taller Franco" />
      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-2 sm:px-6 lg:px-8">
        <div className="px-2 sm:px-0">
          <div className="bg-white shadow rounded-lg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                Gestión de Ventas de Baterías
              </h2>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2 w-full sm:w-auto">
                    <Plus className="w-4 h-4" /> Registrar Venta de Batería
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl mx-4">
                  <DialogHeader>
                    <DialogTitle>Registrar Venta de Batería</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="codigo_bateria">Código de Batería</Label>
                      <Input
                        id="codigo_bateria"
                        value={formData.codigo_bateria}
                        onChange={(e) =>
                          handleInputChange("codigo_bateria", e.target.value)
                        }
                        placeholder="Ingrese el código de la batería"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="producto">Producto (Batería)</Label>
                      <Select
                        value={formData.id_producto}
                        onValueChange={(value) =>
                          handleInputChange("id_producto", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar batería" />
                        </SelectTrigger>
                        <SelectContent>
                          {productosBaterias.map((producto) => (
                            <SelectItem
                              key={producto.id_producto}
                              value={producto.id_producto.toString()}
                            >
                              {producto.codigo_producto}{" "}
                              {/* - {producto.nombre_producto} */}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fecha_venta">Fecha de Venta</Label>
                      <Input
                        id="fecha_venta"
                        type="date"
                        value={formData.fecha_venta}
                        onChange={(e) =>
                          handleInputChange("fecha_venta", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="garantia">Garantía</Label>
                      <Input
                        id="garantia"
                        value={formData.garantia}
                        onChange={(e) =>
                          handleInputChange("garantia", e.target.value)
                        }
                        placeholder="Ej: 12 meses"
                      />
                    </div>
                    <div className="space-y-2 col-span-1 sm:col-span-2">
                      <Label htmlFor="comprador">Comprador</Label>
                      <Input
                        id="comprador"
                        value={formData.comprador}
                        onChange={(e) =>
                          handleInputChange("comprador", e.target.value)
                        }
                        placeholder="Nombre del comprador"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-end gap-2 mt-6">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDialogOpen(false);
                        resetForm();
                      }}
                      className="w-full sm:w-auto"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={showCreateConfirmation}
                      className="flex items-center gap-2 w-full sm:w-auto"
                    >
                      <Save className="w-4 h-4" />
                      Guardar
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Tabla responsive */}
            <div className="overflow-x-auto">
              <div className="min-w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código de Batería</TableHead>
                      <TableHead>Tipo de Batería</TableHead>
                      <TableHead>Fecha de Venta</TableHead>
                      <TableHead>Garantía</TableHead>
                      <TableHead>Comprador</TableHead>
                      <TableHead className="text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ventasBaterias.map((ventaBateria, index) => {
                      const productoInfo = getProductoInfo(
                        ventaBateria.id_producto
                      );
                      return (
                        <TableRow
                          key={
                            ventaBateria.id_venta_bateria
                              ? String(ventaBateria.id_venta_bateria)
                              : `venta-${index}`
                          }
                        >
                          <TableCell className="font-medium">
                            {ventaBateria.codigo_bateria}
                          </TableCell>
                          <TableCell>{productoInfo.codigo}</TableCell>
                          <TableCell>
                            {new Date(
                              ventaBateria.fecha_venta
                            ).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{ventaBateria.garantia}</TableCell>
                          <TableCell>{ventaBateria.comprador || "-"}</TableCell>
                          <TableCell>
                            <div className="flex flex-col sm:flex-row gap-2 justify-center">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex items-center gap-1 text-xs"
                                onClick={() => openEditDialog(ventaBateria)}
                              >
                                <Edit className="w-3 h-3" />
                                <span className="hidden sm:inline">Editar</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="flex items-center gap-1 text-xs"
                                onClick={() => openDeleteDialog(ventaBateria)}
                              >
                                <Trash2 className="w-3 h-3" />
                                <span className="hidden sm:inline">
                                  Eliminar
                                </span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Dialog para editar venta de batería */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl mx-4">
          <DialogHeader>
            <DialogTitle>Editar Venta de Batería</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-codigo_bateria">Código de Batería</Label>
              <Input
                id="edit-codigo_bateria"
                value={formData.codigo_bateria}
                onChange={(e) =>
                  handleInputChange("codigo_bateria", e.target.value)
                }
                placeholder="Ingrese el código de la batería"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-producto">Producto (Batería)</Label>
              <Select
                value={formData.id_producto}
                onValueChange={(value) =>
                  handleInputChange("id_producto", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar batería" />
                </SelectTrigger>
                <SelectContent>
                  {productosBaterias.map((producto) => (
                    <SelectItem
                      key={producto.id_producto}
                      value={producto.id_producto.toString()}
                    >
                      {producto.codigo_producto}{" "}
                      {/* - {producto.nombre_producto} */}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-fecha_venta">Fecha de Venta</Label>
              <Input
                id="edit-fecha_venta"
                type="date"
                value={formData.fecha_venta}
                onChange={(e) =>
                  handleInputChange("fecha_venta", e.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-garantia">Garantía</Label>
              <Input
                id="edit-garantia"
                value={formData.garantia}
                onChange={(e) => handleInputChange("garantia", e.target.value)}
                placeholder="Ej: 12 meses"
              />
            </div>
            <div className="space-y-2 col-span-1 sm:col-span-2">
              <Label htmlFor="edit-comprador">Comprador</Label>
              <Input
                id="edit-comprador"
                value={formData.comprador}
                onChange={(e) => handleInputChange("comprador", e.target.value)}
                placeholder="Nombre del comprador"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false);
                setSelectedVentaBateria(null);
                resetForm();
              }}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              onClick={showEditConfirmation}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <Save className="w-4 h-4" />
              Guardar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para confirmar creación */}
      <Dialog
        open={confirmCreateDialogOpen}
        onOpenChange={setConfirmCreateDialogOpen}
      >
        <DialogContent className="mx-4">
          <DialogHeader>
            <DialogTitle>Confirmar Registro</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              ¿Estás seguro de que quieres registrar la venta de batería con la
              siguiente información?
            </p>
            <div className="mt-4 space-y-2 text-sm">
              <p>
                <strong>Código de Batería:</strong>{" "}
                {formData.codigo_bateria || "No especificado"}
              </p>
              <p>
                <strong>Producto:</strong>{" "}
                {formData.id_producto
                  ? productosBaterias.find(
                      (p) => p.id_producto.toString() === formData.id_producto
                    )?.nombre_producto
                  : "No especificado"}
              </p>
              <p>
                <strong>Fecha de Venta:</strong>{" "}
                {formData.fecha_venta || "No especificada"}
              </p>
              <p>
                <strong>Garantía:</strong>{" "}
                {formData.garantia || "No especificada"}
              </p>
              <p>
                <strong>Comprador:</strong>{" "}
                {formData.comprador || "No especificado"}
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmCreateDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateVentaBateria}
              disabled={isSubmitting}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? "Registrando..." : "Registrar Venta"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para confirmar edición */}
      <Dialog
        open={confirmEditDialogOpen}
        onOpenChange={setConfirmEditDialogOpen}
      >
        <DialogContent className="mx-4">
          <DialogHeader>
            <DialogTitle>Confirmar Actualización</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              ¿Estás seguro de que quieres actualizar la venta de batería con la
              siguiente información?
            </p>
            <div className="mt-4 space-y-2 text-sm">
              <p>
                <strong>Código de Batería:</strong>{" "}
                {formData.codigo_bateria || "No especificado"}
              </p>
              <p>
                <strong>Producto:</strong>{" "}
                {formData.id_producto
                  ? productosBaterias.find(
                      (p) => p.id_producto.toString() === formData.id_producto
                    )?.nombre_producto
                  : "No especificado"}
              </p>
              <p>
                <strong>Fecha de Venta:</strong>{" "}
                {formData.fecha_venta || "No especificada"}
              </p>
              <p>
                <strong>Garantía:</strong>{" "}
                {formData.garantia || "No especificada"}
              </p>
              <p>
                <strong>Comprador:</strong>{" "}
                {formData.comprador || "No especificado"}
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmEditDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleEditVentaBateria}
              disabled={isSubmitting}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? "Actualizando..." : "Actualizar Venta"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
