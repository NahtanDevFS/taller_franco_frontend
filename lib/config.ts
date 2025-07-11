// Configuración centralizada para las URLs del backend
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_BASE_URL) {
  throw new Error(
    "La variable NEXT_PUBLIC_API_URL no está definida en el entorno."
  );
}

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
  },
  PRODUCTOS: {
    BASE: `${API_BASE_URL}/api/productos`,
    CATEGORIAS: `${API_BASE_URL}/api/categorias`,
    MARCAS: `${API_BASE_URL}/api/marcas_producto`,
  },
  VENTA_BATERIAS: {
    BASE: `${API_BASE_URL}/api/venta_baterias`,
  },
};
