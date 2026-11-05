# Bienestar Moral

Plataforma web de la organización **Bienestar Moral** con dos visuales:

1. **Sitio público** (`/`, `/valores-humanos`): portada, historia, fundadores, misión y visión, y el catálogo de cartillas descargables separado en Primaria y Secundaria.
2. **Panel de gestión** (`/admin`): edición de cada página y sus secciones, carga de imágenes y administración de cartillas.

| Carpeta     | Tecnología                                                                   |
| ----------- | ---------------------------------------------------------------------------- |
| `frontend/` | Angular 22 (componentes standalone, signals, `httpResource`, zoneless)       |
| `backend/`  | Node.js + TypeScript + Express 5, arquitectura DDD, MySQL, Worker de archivos |

## Puesta en marcha local

Requisitos: Node.js 22.12 o superior y Docker (para MySQL).

```bash
# 1. Base de datos MySQL
docker compose up -d db

# 2. API (http://localhost:3000/api)
cd backend
cp .env.example .env        # revisa JWT_SECRET, ADMIN_EMAIL y ADMIN_PASSWORD
npm install
npm run dev                  # aplica migraciones y crea el contenido inicial al arrancar

# 3. Frontend (http://localhost:4200)
cd ../frontend
npm install
npm start
```

Entra al panel en `http://localhost:4200/admin` con `ADMIN_EMAIL` / `ADMIN_PASSWORD` del `.env`
(el usuario se crea en el primer arranque si no existe).

En desarrollo los archivos se guardan en `backend/storage/public` (`STORAGE_DRIVER=local`) y se sirven en
`http://localhost:3000/uploads`. Así puedes trabajar sin credenciales de Hostinger.

### Pruebas

```bash
cd backend  && npm test        # dominio, casos de uso, API HTTP y Worker real (no requiere MySQL)
cd frontend && npx ng test --watch=false
```

## Almacenamiento en Hostinger

En producción los archivos se suben por FTP/FTPS a la carpeta pública del hosting:

```ini
STORAGE_DRIVER=ftp
FTP_HOST=ftp.tudominio.com
FTP_USER=u123456789
FTP_PASSWORD=********
FTP_SECURE=true
FTP_BASE_DIR=public_html/uploads
PUBLIC_FILES_BASE_URL=https://tudominio.com/uploads
```

Las credenciales FTP están en hPanel → Archivos → Cuentas FTP. `FTP_BASE_DIR` es relativo al directorio
inicial de la cuenta FTP y debe quedar dentro de `public_html` para que los archivos sean públicos.

## API

Lectura pública; las escrituras requieren `Authorization: Bearer <token>`.

| Método                | Ruta                            | Descripción                                    |
| --------------------- | ------------------------------- | ---------------------------------------------- |
| `POST`                | `/api/auth/login`               | Inicia sesión del administrador                |
| `GET`                 | `/api/sections?page=home`       | Secciones de una página (`home`, `human-values`) |
| `GET`                 | `/api/sections/:id`             | Una sección con sus elementos                  |
| `POST` `PUT` `DELETE` | `/api/sections[/:id]`           | Crear, editar (incluye elementos) o eliminar   |
| `GET`                 | `/api/worksheets?level=primary` | Cartillas (filtro opcional por nivel)          |
| `GET`                 | `/api/worksheets/:id/download`  | Descarga directa de la cartilla                |
| `POST` `PUT`          | `/api/worksheets[/:id]`         | Crear/editar cartilla (`multipart/form-data`)  |
| `DELETE`              | `/api/worksheets/:id`           | Elimina la cartilla y su archivo               |
| `POST`                | `/api/media/images`             | Sube una imagen y devuelve su URL pública      |
| `GET`                 | `/api/health`                   | Estado de la API y la base de datos            |

Todos los errores usan el mismo formato:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "…", "details": { "fields": [] } } }
```

## Requisitos → código

| Requisito | Dónde está |
| --- | --- |
| RF-01.2 Inicio: portada, carrusel de historia, carrusel de fundadores, misión y visión | `frontend/src/app/public/home`, `public/components/carousel` |
| RF-01.3 Cartillas descargables en Primaria y Secundaria | `frontend/src/app/public/human-values`, `backend/src/modules/worksheets` |
| RF-02.1 Gestión de secciones y contenidos | `frontend/src/app/admin/sections`, `backend/src/modules/site-content` |
| RF-02.2 Carga de imágenes y cartillas a Hostinger | `admin/shared/image-field.ts`, `admin/worksheets`, `backend/src/modules/media` |
| RNF-02 / ARQ-02 Worker de carga y descarga | `backend/src/modules/media/infrastructure/worker` (pool de `worker_threads`) |
| ARQ-01 Capas DDD | `backend/src/modules/<módulo>/{domain,application,infrastructure,interface}` |
| ARQ-03 Inyección de dependencias | Backend: `backend/src/container.ts` (awilix). Frontend: token `API_CONFIG` e `inject()` |
| ARQ-04 Manejo centralizado de errores | `backend/src/shared/infrastructure/http/errorHandler.ts` |
| ARQ-05 Repository | `domain/*Repository.ts` (interfaz) + `infrastructure/MySql*Repository.ts` |
| ARQ-05 Factory / Builder | `SectionFactory`, `Worksheet.builder()` |
| ARQ-05 Strategy | `modules/media/infrastructure/storage` (`FtpStorageProvider`, `LocalStorageProvider`) |

## Notas

- Las secciones estructurales (portada, historia, fundadores, misión/visión e introducción de valores humanos) se pueden editar pero no eliminar; se pueden agregar secciones adicionales a cualquier página.
- Al reemplazar o eliminar una cartilla se borra su archivo del hosting. Las imágenes reemplazadas en secciones **no** se borran automáticamente, porque la misma URL podría estar en uso en otra sección.
- Las descargas se cachean en `backend/storage/cache` para no ir a Hostinger en cada petición.
