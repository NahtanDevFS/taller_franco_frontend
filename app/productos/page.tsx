"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/auth";
import { API_ENDPOINTS } from "@/lib/config";
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
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, Save, X } from "lucide-react";
import Swal from "sweetalert2";
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";

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

interface Categoria {
  id_categoria_producto: number;
  nombre_categoria_producto: string;
}

interface Marca {
  id_marca_producto: number;
  nombre_marca_producto: string;
}

interface ProductoForm {
  codigo_producto: string;
  nombre_producto: string;
  descripcion_producto: string;
  id_categoria_producto: string;
  stock_producto: string;
  stock_minimo_producto: string;
  precio_producto: string;
  foto1_producto: string;
  foto2_producto: string;
  id_marca_producto: string;
}

// Utilidad para convertir imagen a WebP
async function fileToWebP(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const reader = new FileReader();
    reader.onload = (e) => {
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("No se pudo convertir a WebP"));
          },
          "image/webp",
          0.9
        );
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Subir imagen a Supabase Storage
async function uploadImageToSupabaseWebP(
  file: File,
  folder: string = "products"
) {
  try {
    console.log("Iniciando subida de imagen:", file.name);

    // Verificar configuración de Supabase
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      throw new Error("Configuración de Supabase no encontrada");
    }

    const webpBlob = await fileToWebP(file);
    console.log("Imagen convertida a WebP, tamaño:", webpBlob.size);

    const fileName = `${folder}/${uuidv4()}.webp`;
    console.log("Nombre del archivo:", fileName);

    // Intentar acceder directamente al bucket sin verificar primero
    console.log("Intentando acceder directamente al bucket:", folder);

    const { data, error } = await supabase.storage
      .from(folder)
      .upload(fileName, webpBlob, {
        cacheControl: "3600",
        upsert: false,
        contentType: "image/webp",
      });

    if (error) {
      console.error("Error al subir a Supabase:", error);

      // Manejar errores específicos de RLS
      if (
        error.message?.includes("row-level security policy") ||
        (error as any).statusCode === "403"
      ) {
        throw new Error(
          `Error de permisos: Las políticas de seguridad (RLS) están bloqueando la subida. Error: ${error.message}`
        );
      }

      throw error;
    }

    console.log("Archivo subido exitosamente:", data);

    // Obtener URL pública
    const { data: publicUrlData } = supabase.storage
      .from(folder)
      .getPublicUrl(fileName);

    console.log("URL pública generada:", publicUrlData.publicUrl);
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error("Error en uploadImageToSupabaseWebP:", error);
    throw error;
  }
}

export default function ProductosPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  //const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [confirmCreateDialogOpen, setConfirmCreateDialogOpen] = useState(false);
  const [confirmEditDialogOpen, setConfirmEditDialogOpen] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(
    null
  );
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todas");
  const [busqueda, setBusqueda] = useState<string>("");
  const [formData, setFormData] = useState<ProductoForm>({
    codigo_producto: "",
    nombre_producto: "",
    descripcion_producto: "",
    id_categoria_producto: "",
    stock_producto: "",
    stock_minimo_producto: "",
    precio_producto: "",
    foto1_producto: "",
    foto2_producto: "",
    id_marca_producto: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Verificar configuración de Supabase
    console.log("Verificando configuración de Supabase...");
    console.log(
      "NEXT_PUBLIC_SUPABASE_URL:",
      process.env.NEXT_PUBLIC_SUPABASE_URL ? "Configurada" : "NO CONFIGURADA"
    );
    console.log(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY:",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        ? "Configurada"
        : "NO CONFIGURADA"
    );

    if (!authService.isAuthenticated()) {
      router.push("/login");
      return;
    }
    fetchProductos();
    fetchCategorias();
    fetchMarcas();
    setLoading(false);
  }, [router]);

  const fetchProductos = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.PRODUCTOS.BASE);
      const data = await res.json();
      console.log(data);
      setProductos(data);
    } catch (error) {
      console.error("Error al obtener productos:", error);
    }
  };

  const fetchCategorias = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.PRODUCTOS.CATEGORIAS);
      const data = await res.json();
      console.log("Categorías:", data);
      setCategorias(data);
    } catch (error) {
      console.error("Error al obtener categorías:", error);
    }
  };

  const fetchMarcas = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.PRODUCTOS.MARCAS);
      const data = await res.json();
      console.log("Marcas:", data);
      setMarcas(data);
    } catch (error) {
      console.error("Error al obtener marcas:", error);
    }
  };

  const getCategoriaNombre = (idCategoria: number | null) => {
    if (!idCategoria) return "-";
    const categoria = categorias.find(
      (cat) => cat.id_categoria_producto === idCategoria
    );
    return categoria
      ? categoria.nombre_categoria_producto
      : `ID: ${idCategoria}`;
  };

  const getMarcaNombre = (idMarca: number | null) => {
    if (!idMarca) return "-";
    const marca = marcas.find((m) => m.id_marca_producto === idMarca);
    return marca ? marca.nombre_marca_producto : `ID: ${idMarca}`;
  };

  const resetForm = () => {
    setFormData({
      codigo_producto: "",
      nombre_producto: "",
      descripcion_producto: "",
      id_categoria_producto: "",
      stock_producto: "",
      stock_minimo_producto: "",
      precio_producto: "",
      foto1_producto: "",
      foto2_producto: "",
      id_marca_producto: "",
    });
  };

  const handleInputChange = (field: keyof ProductoForm, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateProducto = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(API_ENDPOINTS.PRODUCTOS.BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          codigo_producto: formData.codigo_producto || null,
          nombre_producto: formData.nombre_producto || null,
          descripcion_producto: formData.descripcion_producto || null,
          id_categoria_producto: formData.id_categoria_producto
            ? parseInt(formData.id_categoria_producto)
            : null,
          stock_producto: formData.stock_producto
            ? parseInt(formData.stock_producto)
            : null,
          stock_minimo_producto: formData.stock_minimo_producto
            ? parseInt(formData.stock_minimo_producto)
            : null,
          precio_producto: formData.precio_producto || null,
          foto1_producto: formData.foto1_producto || null,
          foto2_producto: formData.foto2_producto || null,
          id_marca_producto:
            formData.id_marca_producto && formData.id_marca_producto !== ""
              ? parseInt(formData.id_marca_producto)
              : null,
        }),
      });

      if (res.ok) {
        const newProducto = await res.json();
        setProductos((prev) => [...prev, newProducto]);
        setConfirmCreateDialogOpen(false);
        setDialogOpen(false);
        resetForm();
        Swal.fire({
          icon: "success",
          title: "¡Éxito!",
          text: "Producto creado exitosamente",
          confirmButtonColor: "#3085d6",
          confirmButtonText: "Aceptar",
          backdrop: false,
        });
      } else {
        const errorData = await res.json();
        Swal.fire({
          icon: "error",
          title: "Error",
          text: errorData.error,
          confirmButtonColor: "#d33",
          confirmButtonText: "Aceptar",
          backdrop: false,
        });
      }
    } catch (error) {
      console.error("Error al crear producto:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error al crear el producto",
        confirmButtonColor: "#d33",
        confirmButtonText: "Aceptar",
        backdrop: false,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditProducto = async () => {
    if (!selectedProducto) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(
        `${API_ENDPOINTS.PRODUCTOS.BASE}/${selectedProducto.id_producto}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            codigo_producto: formData.codigo_producto || null,
            nombre_producto: formData.nombre_producto || null,
            descripcion_producto: formData.descripcion_producto || null,
            id_categoria_producto: formData.id_categoria_producto
              ? parseInt(formData.id_categoria_producto)
              : null,
            stock_producto: formData.stock_producto
              ? parseInt(formData.stock_producto)
              : null,
            stock_minimo_producto: formData.stock_minimo_producto
              ? parseInt(formData.stock_minimo_producto)
              : null,
            precio_producto: formData.precio_producto || null,
            foto1_producto: formData.foto1_producto || null,
            foto2_producto: formData.foto2_producto || null,
            id_marca_producto:
              formData.id_marca_producto &&
              formData.id_marca_producto !== "no especificada"
                ? parseInt(formData.id_marca_producto)
                : null,
          }),
        }
      );

      if (res.ok) {
        const updatedProducto = await res.json();
        setProductos((prev) =>
          prev.map((p) =>
            p.id_producto === selectedProducto.id_producto ? updatedProducto : p
          )
        );
        setConfirmEditDialogOpen(false);
        setEditDialogOpen(false);
        setSelectedProducto(null);
        resetForm();
        Swal.fire({
          icon: "success",
          title: "¡Éxito!",
          text: "Producto actualizado exitosamente",
          confirmButtonColor: "#3085d6",
          confirmButtonText: "Aceptar",
          backdrop: false,
        });
      } else {
        const errorData = await res.json();
        Swal.fire({
          icon: "error",
          title: "Error",
          text: errorData.error,
          confirmButtonColor: "#d33",
          confirmButtonText: "Aceptar",
          backdrop: false,
        });
      }
    } catch (error) {
      console.error("Error al actualizar producto:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error al actualizar el producto",
        confirmButtonColor: "#d33",
        confirmButtonText: "Aceptar",
        backdrop: false,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProducto = async () => {
    if (!selectedProducto) return;

    try {
      const res = await fetch(
        `${API_ENDPOINTS.PRODUCTOS.BASE}/${selectedProducto.id_producto}`,
        {
          method: "DELETE",
        }
      );

      if (res.ok) {
        setProductos((prev) =>
          prev.filter((p) => p.id_producto !== selectedProducto.id_producto)
        );
        setSelectedProducto(null);
        Swal.fire({
          icon: "success",
          title: "¡Éxito!",
          text: "Producto eliminado exitosamente",
          confirmButtonColor: "#3085d6",
          confirmButtonText: "Aceptar",
          backdrop: false,
        });
      } else {
        const errorData = await res.json();
        Swal.fire({
          icon: "error",
          title: "Error",
          text: errorData.error,
          confirmButtonColor: "#d33",
          confirmButtonText: "Aceptar",
          backdrop: false,
        });
      }
    } catch (error) {
      console.error("Error al eliminar producto:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error al eliminar el producto",
        confirmButtonColor: "#d33",
        confirmButtonText: "Aceptar",
        backdrop: false,
      });
    }
  };

  const openEditDialog = (producto: Producto) => {
    setSelectedProducto(producto);
    setFormData({
      codigo_producto: producto.codigo_producto || "",
      nombre_producto: producto.nombre_producto || "",
      descripcion_producto: producto.descripcion_producto || "",
      id_categoria_producto: producto.id_categoria_producto?.toString() || "",
      stock_producto: producto.stock_producto?.toString() || "",
      stock_minimo_producto: producto.stock_minimo_producto?.toString() || "",
      precio_producto: producto.precio_producto || "",
      foto1_producto: producto.foto1_producto || "",
      foto2_producto: producto.foto2_producto || "",
      id_marca_producto: producto.id_marca_producto?.toString() || "",
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = async (producto: Producto) => {
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: `¿Quieres eliminar el producto "${
        producto.nombre_producto || "sin nombre"
      }"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      setSelectedProducto(producto);
      handleDeleteProducto();
    }
  };

  const showCreateConfirmation = () => {
    setConfirmCreateDialogOpen(true);
  };

  const showEditConfirmation = () => {
    setConfirmEditDialogOpen(true);
  };

  // Filtrar productos por categoría y búsqueda
  const productosFiltrados = productos.filter((producto) => {
    // Filtro por categoría
    const cumpleCategoria =
      filtroCategoria === "todas" ||
      producto.id_categoria_producto?.toString() === filtroCategoria;

    // Filtro por búsqueda
    const cumpleBusqueda =
      !busqueda ||
      (producto.codigo_producto &&
        producto.codigo_producto
          .toLowerCase()
          .includes(busqueda.toLowerCase())) ||
      (producto.nombre_producto &&
        producto.nombre_producto
          .toLowerCase()
          .includes(busqueda.toLowerCase())) ||
      (producto.descripcion_producto &&
        producto.descripcion_producto
          .toLowerCase()
          .includes(busqueda.toLowerCase()));

    return cumpleCategoria && cumpleBusqueda;
  });

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
      <Header title="Gestión de Productos - Taller Franco" />
      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-2 sm:px-6 lg:px-8">
        <div className="px-2 sm:px-0">
          <div className="bg-white shadow rounded-lg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                Gestión de Productos
              </h2>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white gap-2 w-full sm:w-auto">
                    <Plus className="w-4 h-4" /> Agregar Producto
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
                  <DialogHeader>
                    <DialogTitle>Agregar Producto</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="marca">Marca</Label>
                      <Select
                        value={formData.id_marca_producto}
                        onValueChange={(value) =>
                          handleInputChange("id_marca_producto", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar marca" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no especificada">
                            No especificada
                          </SelectItem>
                          {marcas.map((marca) => (
                            <SelectItem
                              key={marca.id_marca_producto}
                              value={marca.id_marca_producto.toString()}
                            >
                              {marca.nombre_marca_producto}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="codigo">Código</Label>
                      <Input
                        id="codigo"
                        value={formData.codigo_producto}
                        onChange={(e) =>
                          handleInputChange("codigo_producto", e.target.value)
                        }
                        placeholder="Ingrese el código del producto"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nombre">Nombre</Label>
                      <Input
                        id="nombre"
                        value={formData.nombre_producto}
                        onChange={(e) =>
                          handleInputChange("nombre_producto", e.target.value)
                        }
                        placeholder="Ingrese el nombre del producto"
                      />
                    </div>
                    <div className="space-y-2 col-span-1 sm:col-span-2">
                      <Label htmlFor="descripcion">Descripción</Label>
                      <Textarea
                        id="descripcion"
                        value={formData.descripcion_producto}
                        onChange={(e) =>
                          handleInputChange(
                            "descripcion_producto",
                            e.target.value
                          )
                        }
                        placeholder="Ingrese la descripción del producto"
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="categoria">Categoría</Label>
                      <Select
                        value={formData.id_categoria_producto}
                        onValueChange={(value) =>
                          handleInputChange("id_categoria_producto", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          {categorias.map((categoria) => (
                            <SelectItem
                              key={categoria.id_categoria_producto}
                              value={categoria.id_categoria_producto.toString()}
                            >
                              {categoria.nombre_categoria_producto}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stock">Stock</Label>
                      <Input
                        id="stock"
                        type="number"
                        value={formData.stock_producto}
                        onChange={(e) =>
                          handleInputChange("stock_producto", e.target.value)
                        }
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stock_minimo">Stock Mínimo</Label>
                      <Input
                        id="stock_minimo"
                        type="number"
                        value={formData.stock_minimo_producto}
                        onChange={(e) =>
                          handleInputChange(
                            "stock_minimo_producto",
                            e.target.value
                          )
                        }
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="precio">Precio</Label>
                      <Input
                        id="precio"
                        type="number"
                        step="0.01"
                        value={formData.precio_producto}
                        onChange={(e) =>
                          handleInputChange("precio_producto", e.target.value)
                        }
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="foto1">Foto 1</Label>
                      <Input
                        id="foto1"
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              console.log(
                                "Procesando archivo:",
                                file.name,
                                "Tamaño:",
                                file.size
                              );
                              const url = await uploadImageToSupabaseWebP(file);
                              console.log("URL obtenida:", url);
                              handleInputChange("foto1_producto", url);
                              Swal.fire({
                                icon: "success",
                                title: "¡Éxito!",
                                text: "Imagen subida correctamente",
                                timer: 2000,
                                showConfirmButton: false,
                              });
                            } catch (err) {
                              console.error("Error al subir imagen:", err);
                              Swal.fire({
                                icon: "error",
                                title: "Error",
                                text: `No se pudo subir la imagen: ${
                                  err instanceof Error
                                    ? err.message
                                    : "Error desconocido"
                                }`,
                              });
                            }
                          }
                        }}
                      />
                      {formData.foto1_producto && (
                        <div className="mt-2">
                          <img
                            src={formData.foto1_producto}
                            alt="Foto 1"
                            className="w-20 h-20 object-cover rounded"
                          />
                          <Input
                            value={formData.foto1_producto}
                            readOnly
                            className="mt-1"
                          />
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="foto2">Foto 2</Label>
                      <Input
                        id="foto2"
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              console.log(
                                "Procesando archivo:",
                                file.name,
                                "Tamaño:",
                                file.size
                              );
                              const url = await uploadImageToSupabaseWebP(file);
                              console.log("URL obtenida:", url);
                              handleInputChange("foto2_producto", url);
                              Swal.fire({
                                icon: "success",
                                title: "¡Éxito!",
                                text: "Imagen subida correctamente",
                                timer: 2000,
                                showConfirmButton: false,
                              });
                            } catch (err) {
                              console.error("Error al subir imagen:", err);
                              Swal.fire({
                                icon: "error",
                                title: "Error",
                                text: `No se pudo subir la imagen: ${
                                  err instanceof Error
                                    ? err.message
                                    : "Error desconocido"
                                }`,
                              });
                            }
                          }
                        }}
                      />
                      {formData.foto2_producto && (
                        <div className="mt-2">
                          <img
                            src={formData.foto2_producto}
                            alt="Foto 2"
                            className="w-20 h-20 object-cover rounded"
                          />
                          <Input
                            value={formData.foto2_producto}
                            readOnly
                            className="mt-1"
                          />
                        </div>
                      )}
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

            {/* Filtros y búsqueda */}
            <div className="mb-6 space-y-4">
              {/* Barra de búsqueda */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Label htmlFor="busqueda" className="text-sm font-medium">
                  Buscar productos:
                </Label>
                <div className="relative w-full sm:w-80">
                  <Input
                    id="busqueda"
                    type="text"
                    placeholder="Buscar por código, nombre o descripción..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="pr-10"
                  />
                  {busqueda && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setBusqueda("")}
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Filtro por categoría */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Label
                  htmlFor="filtro-categoria"
                  className="text-sm font-medium"
                >
                  Filtrar por categoría:
                </Label>
                <Select
                  value={filtroCategoria}
                  onValueChange={setFiltroCategoria}
                >
                  <SelectTrigger className="w-full sm:w-64">
                    <SelectValue placeholder="Todas las categorías" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas las categorías</SelectItem>
                    {categorias.map((categoria) => (
                      <SelectItem
                        key={categoria.id_categoria_producto}
                        value={categoria.id_categoria_producto.toString()}
                      >
                        {categoria.nombre_categoria_producto}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(filtroCategoria !== "todas" || busqueda) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFiltroCategoria("todas");
                      setBusqueda("");
                    }}
                    className="flex items-center gap-1 w-full sm:w-auto"
                  >
                    <X className="w-4 h-4" />
                    Limpiar filtros
                  </Button>
                )}
              </div>

              {/* Información de resultados */}
              {(filtroCategoria !== "todas" || busqueda) && (
                <p className="text-sm text-gray-600">
                  Mostrando {productosFiltrados.length} de {productos.length}{" "}
                  productos
                  {busqueda && <span> que coinciden con: {busqueda}</span>}
                  {filtroCategoria !== "todas" && (
                    <span> en la categoría seleccionada</span>
                  )}
                </p>
              )}
            </div>

            {/* Tabla responsive */}
            <div className="overflow-x-auto">
              <div className="min-w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Marca</TableHead>
                      <TableHead>Código</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>Foto 1</TableHead>
                      <TableHead>Foto 2</TableHead>
                      <TableHead className="text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productosFiltrados.map((producto, index) => (
                      <TableRow
                        key={
                          producto.id_producto
                            ? String(producto.id_producto)
                            : `producto-${index}`
                        }
                      >
                        <TableCell>
                          {getMarcaNombre(producto.id_marca_producto)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {producto.codigo_producto || "-"}
                        </TableCell>
                        <TableCell>{producto.nombre_producto || "-"}</TableCell>
                        <TableCell>
                          <div
                            className="max-w-xs truncate"
                            title={producto.descripcion_producto || ""}
                          >
                            {producto.descripcion_producto || "-"}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getCategoriaNombre(producto.id_categoria_producto)}
                        </TableCell>
                        <TableCell>{producto.stock_producto || "-"}</TableCell>
                        <TableCell>
                          {producto.precio_producto
                            ? `Q${producto.precio_producto}`
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {producto.foto1_producto ? (
                            <img
                              src={producto.foto1_producto}
                              alt="Foto 1"
                              className="w-12 h-12 object-cover rounded"
                              onError={(e) => {
                                e.currentTarget.src = "/file.svg";
                                e.currentTarget.alt = "Sin imagen";
                              }}
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                              <img
                                src="/file.svg"
                                alt="Sin imagen"
                                className="w-6 h-6 text-gray-400"
                              />
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {producto.foto2_producto ? (
                            <img
                              src={producto.foto2_producto}
                              alt="Foto 2"
                              className="w-12 h-12 object-cover rounded"
                              onError={(e) => {
                                e.currentTarget.src = "/file.svg";
                                e.currentTarget.alt = "Sin imagen";
                              }}
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                              <img
                                src="/file.svg"
                                alt="Sin imagen"
                                className="w-6 h-6 text-gray-400"
                              />
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col sm:flex-row gap-2 justify-center">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex items-center gap-1 text-xs"
                              onClick={() => openEditDialog(producto)}
                            >
                              <Edit className="w-3 h-3" />
                              <span className="hidden sm:inline">Editar</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="flex items-center gap-1 text-xs"
                              onClick={() => openDeleteDialog(producto)}
                            >
                              <Trash2 className="w-3 h-3" />
                              <span className="hidden sm:inline">Eliminar</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Dialog para editar producto */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
          <DialogHeader>
            <DialogTitle>Editar Producto</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-marca">Marca</Label>
              <Select
                value={formData.id_marca_producto}
                onValueChange={(value) =>
                  handleInputChange("id_marca_producto", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar marca" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No especificada</SelectItem>
                  {marcas.map((marca) => (
                    <SelectItem
                      key={marca.id_marca_producto}
                      value={marca.id_marca_producto.toString()}
                    >
                      {marca.nombre_marca_producto}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-codigo">Código</Label>
              <Input
                id="edit-codigo"
                value={formData.codigo_producto}
                onChange={(e) =>
                  handleInputChange("codigo_producto", e.target.value)
                }
                placeholder="Ingrese el código del producto"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-nombre">Nombre</Label>
              <Input
                id="edit-nombre"
                value={formData.nombre_producto}
                onChange={(e) =>
                  handleInputChange("nombre_producto", e.target.value)
                }
                placeholder="Ingrese el nombre del producto"
              />
            </div>
            <div className="space-y-2 col-span-1 sm:col-span-2">
              <Label htmlFor="edit-descripcion">Descripción</Label>
              <Textarea
                id="edit-descripcion"
                value={formData.descripcion_producto}
                onChange={(e) =>
                  handleInputChange("descripcion_producto", e.target.value)
                }
                placeholder="Ingrese la descripción del producto"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-categoria">Categoría</Label>
              <Select
                value={formData.id_categoria_producto}
                onValueChange={(value) =>
                  handleInputChange("id_categoria_producto", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((categoria) => (
                    <SelectItem
                      key={categoria.id_categoria_producto}
                      value={categoria.id_categoria_producto.toString()}
                    >
                      {categoria.nombre_categoria_producto}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-stock">Stock</Label>
              <Input
                id="edit-stock"
                type="number"
                value={formData.stock_producto}
                onChange={(e) =>
                  handleInputChange("stock_producto", e.target.value)
                }
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-stock-minimo">Stock Mínimo</Label>
              <Input
                id="edit-stock-minimo"
                type="number"
                value={formData.stock_minimo_producto}
                onChange={(e) =>
                  handleInputChange("stock_minimo_producto", e.target.value)
                }
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-precio">Precio</Label>
              <Input
                id="edit-precio"
                type="number"
                step="0.01"
                value={formData.precio_producto}
                onChange={(e) =>
                  handleInputChange("precio_producto", e.target.value)
                }
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-foto1">Foto 1</Label>
              <Input
                id="edit-foto1"
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    try {
                      console.log(
                        "Procesando archivo:",
                        file.name,
                        "Tamaño:",
                        file.size
                      );
                      const url = await uploadImageToSupabaseWebP(file);
                      console.log("URL obtenida:", url);
                      handleInputChange("foto1_producto", url);
                      Swal.fire({
                        icon: "success",
                        title: "¡Éxito!",
                        text: "Imagen subida correctamente",
                        timer: 2000,
                        showConfirmButton: false,
                      });
                    } catch (err) {
                      console.error("Error al subir imagen:", err);
                      Swal.fire({
                        icon: "error",
                        title: "Error",
                        text: `No se pudo subir la imagen: ${
                          err instanceof Error
                            ? err.message
                            : "Error desconocido"
                        }`,
                      });
                    }
                  }
                }}
              />
              {formData.foto1_producto && (
                <div className="mt-2">
                  <img
                    src={formData.foto1_producto}
                    alt="Foto 1"
                    className="w-20 h-20 object-cover rounded"
                  />
                  <Input
                    value={formData.foto1_producto}
                    readOnly
                    className="mt-1"
                  />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-foto2">Foto 2</Label>
              <Input
                id="edit-foto2"
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    try {
                      console.log(
                        "Procesando archivo:",
                        file.name,
                        "Tamaño:",
                        file.size
                      );
                      const url = await uploadImageToSupabaseWebP(file);
                      console.log("URL obtenida:", url);
                      handleInputChange("foto2_producto", url);
                      Swal.fire({
                        icon: "success",
                        title: "¡Éxito!",
                        text: "Imagen subida correctamente",
                        timer: 2000,
                        showConfirmButton: false,
                      });
                    } catch (err) {
                      console.error("Error al subir imagen:", err);
                      Swal.fire({
                        icon: "error",
                        title: "Error",
                        text: `No se pudo subir la imagen: ${
                          err instanceof Error
                            ? err.message
                            : "Error desconocido"
                        }`,
                      });
                    }
                  }
                }}
              />
              {formData.foto2_producto && (
                <div className="mt-2">
                  <img
                    src={formData.foto2_producto}
                    alt="Foto 2"
                    className="w-20 h-20 object-cover rounded"
                  />
                  <Input
                    value={formData.foto2_producto}
                    readOnly
                    className="mt-1"
                  />
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false);
                setSelectedProducto(null);
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
            <DialogTitle>Confirmar Creación</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              ¿Estás seguro de que quieres crear el producto con la siguiente
              información?
            </p>
            <div className="mt-4 space-y-2 text-sm">
              <p>
                <strong>Código:</strong>{" "}
                {formData.codigo_producto || "No especificado"}
              </p>
              <p>
                <strong>Nombre:</strong>{" "}
                {formData.nombre_producto || "No especificado"}
              </p>
              <p>
                <strong>Descripción:</strong>{" "}
                {formData.descripcion_producto || "No especificada"}
              </p>
              <p>
                <strong>Categoría:</strong>{" "}
                {formData.id_categoria_producto
                  ? categorias.find(
                      (c) =>
                        c.id_categoria_producto.toString() ===
                        formData.id_categoria_producto
                    )?.nombre_categoria_producto
                  : "No especificada"}
              </p>
              <p>
                <strong>Stock:</strong>{" "}
                {formData.stock_producto || "No especificado"}
              </p>
              <p>
                <strong>Stock Mínimo:</strong>{" "}
                {formData.stock_minimo_producto || "No especificado"}
              </p>
              <p>
                <strong>Precio:</strong>{" "}
                {formData.precio_producto
                  ? `Q${formData.precio_producto}`
                  : "No especificado"}
              </p>
              <p>
                <strong>Marca:</strong>{" "}
                {formData.id_marca_producto
                  ? marcas.find(
                      (m) =>
                        m.id_marca_producto.toString() ===
                        formData.id_marca_producto
                    )?.nombre_marca_producto
                  : "No especificada"}
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
              onClick={handleCreateProducto}
              disabled={isSubmitting}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? "Creando..." : "Crear Producto"}
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
              ¿Estás seguro de que quieres actualizar el producto con la
              siguiente información?
            </p>
            <div className="mt-4 space-y-2 text-sm">
              <p>
                <strong>Código:</strong>{" "}
                {formData.codigo_producto || "No especificado"}
              </p>
              <p>
                <strong>Nombre:</strong>{" "}
                {formData.nombre_producto || "No especificado"}
              </p>
              <p>
                <strong>Descripción:</strong>{" "}
                {formData.descripcion_producto || "No especificada"}
              </p>
              <p>
                <strong>Categoría:</strong>{" "}
                {formData.id_categoria_producto
                  ? categorias.find(
                      (c) =>
                        c.id_categoria_producto.toString() ===
                        formData.id_categoria_producto
                    )?.nombre_categoria_producto
                  : "No especificada"}
              </p>
              <p>
                <strong>Stock:</strong>{" "}
                {formData.stock_producto || "No especificado"}
              </p>
              <p>
                <strong>Stock Mínimo:</strong>{" "}
                {formData.stock_minimo_producto || "No especificado"}
              </p>
              <p>
                <strong>Precio:</strong>{" "}
                {formData.precio_producto
                  ? `Q${formData.precio_producto}`
                  : "No especificado"}
              </p>
              <p>
                <strong>Marca:</strong>{" "}
                {formData.id_marca_producto
                  ? marcas.find(
                      (m) =>
                        m.id_marca_producto.toString() ===
                        formData.id_marca_producto
                    )?.nombre_marca_producto
                  : "No especificada"}
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
              onClick={handleEditProducto}
              disabled={isSubmitting}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? "Actualizando..." : "Actualizar Producto"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
