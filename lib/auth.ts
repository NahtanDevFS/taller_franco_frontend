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
      const response = await fetch("http://localhost:3001/api/auth/login", {
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
          // El parámetro path=/ indica que la cookie estará disponible para todas las rutas del dominio (no solo para una ruta específica)
          document.cookie = `authToken=${data.token}; path=/;`;
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
    // Esta línea elimina la cookie de autenticación de inmediato, cerrando la sesión del usuario en el navegador.
    // Esto se debe a que la fecha de expiración está puesta en el pasado (Thu, 01 Jan 1970 00:00:00 GMT), que es la fecha base del tiempo Unix.
    // Cuando el navegador detecta una cookie con una fecha de expiración pasada, la borra automáticamente.
    document.cookie =
      "authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
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
    return !!this.getToken();
  },
};
