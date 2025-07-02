// Configuración centralizada para las URLs del backend
export const API_BASE_URL = "https://taller-franco-backend.vercel.app";

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
