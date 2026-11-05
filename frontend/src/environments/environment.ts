/**
 * Configuración de producción.
 * '/api' asume que la API se publica en el mismo dominio (proxy inverso).
 * Si la API vive en otro dominio, usa la URL completa: 'https://api.tudominio.com/api'.
 */
export const environment = {
  production: true,
  apiUrl: '/api',
};
