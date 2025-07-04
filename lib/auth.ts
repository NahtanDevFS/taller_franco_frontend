import { API_ENDPOINTS } from "./config";

// Servicio de autenticación
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: any;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // Aquí deberías hacer la llamada a tu backend de Node.js
      //INCIALMENTE SE HACE UNA LLAMADA A LA API DE NODE.JS EN MI LOCALHOST
      const response = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok) {
        // Guardar el token en localStorage
        if (data.token) {
          localStorage.setItem("authToken", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
          // Guardamos el token en una cookie para que el middleware de Next.js pueda leerlo y autenticar rutas protegidas
          // Esto es necesario porque el middleware solo puede acceder a cookies, no a localStorage
          // El parámetro path=/ indica que la cookie estará disponible para todas las rutas del dominio
          // Configuramos la cookie para que dure 30 días (1 mes)
          const expirationDate = new Date();
          expirationDate.setDate(expirationDate.getDate() + 30);
          document.cookie = `authToken=${
            data.token
          }; path=/; expires=${expirationDate.toUTCString()}; SameSite=Strict`;
        }
        return {
          success: true,
          message: "Login exitoso",
          token: data.token,
          user: data.user,
        };
      } else {
        return {
          success: false,
          message: data.message || "Error en la autenticación",
        };
      }
    } catch (error) {
      console.error("Error en login:", error);
      return {
        success: false,
        message: "Error de conexión",
      };
    }
  },

  logout() {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    // Eliminar la cookie de autenticación estableciendo una fecha de expiración en el pasado
    // Esto asegura que la cookie se elimine inmediatamente en todos los navegadores
    document.cookie =
      "authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict";
    window.location.href = "/login";
  },

  getToken(): string | null {
    return localStorage.getItem("authToken");
  },

  getUser(): any {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    // Verificar si el token ha expirado (opcional cuando el backend maneja la expiración)
    // Por ahora solo verificamos que existe el token
    return true;
  },

  // Función para renovar la sesión (útil para implementar refresh tokens)
  refreshSession() {
    const token = this.getToken();
    if (token) {
      // Renovar la cookie con la misma duración
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 30);
      document.cookie = `authToken=${token}; path=/; expires=${expirationDate.toUTCString()}; SameSite=Strict`;
    }
  },
};
