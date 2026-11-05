import { InjectionToken } from '@angular/core';

export interface ApiConfig {
  /** URL base de la API, sin barra final. Ej: http://localhost:3000/api */
  baseUrl: string;
}

/**
 * Token de inyección para la configuración de la API (ARQ-03 en el frontend):
 * los servicios piden la configuración por DI en lugar de importar `environment`,
 * así en pruebas se puede proveer otra URL.
 */
export const API_CONFIG = new InjectionToken<ApiConfig>('API_CONFIG');
