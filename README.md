# Bienestar Moral

Plataforma web de la organización **Bienestar Moral** con dos visuales:

1. **Sitio público**, con el logo y los colores de la marca y un menú con las secciones de cada página:

   | Ruta               | Página             | Contenido                                                                     |
   | ------------------ | ------------------ | ----------------------------------------------------------------------------- |
   | `/`                | Inicio             | Portada, ¿qué es Bienestar Moral?, carrusel de historia, fundadores, misión y visión |
   | `/quienes-somos`   | Quiénes somos      | Naturaleza jurídica y reseña histórica (línea de tiempo)                       |
   | `/servicios`       | Servicios de apoyo | Refuerzo de valores en clase, talleres para estudiantes y para padres          |
   | `/valores-humanos` | Valores humanos    | Banco de valores, valores por cubrir y cartillas por nivel (Preescolar, Primaria, Secundaria) |
   | `/equipo`          | Equipo de trabajo  | Docentes misioneros, conferencistas, dirección y equipo de apoyo               |
   | `/contacto`        | Contáctenos        | Datos de contacto (correo, WhatsApp, mapa) y representación legal              |

2. **Panel de gestión** (`/admin`): edición de cada página y sus secciones, carga de imágenes y administración de cartillas.
   Todo el contenido del sitio sale de la base de datos, así que cualquier texto, foto o sección se cambia desde aquí.

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

## Despliegue en Hostinger (una sola app)

Producción corre como **una sola Node.js web app** (plan Business o Cloud) en `bienestarmoral.com`:
la API atiende `/api` y `/uploads` y sirve también el sitio Angular compilado. Cada `git push` a `main`
vuelve a compilar y publicar todo.

| Ajuste de la app (hPanel)  | Valor                         |
| -------------------------- | ----------------------------- |
| Directorio raíz            | `backend`                     |
| Framework                  | Express                       |
| Comando de build           | `npm run build`               |
| Directorio de salida       | (vacío)                       |
| Archivo de entrada         | `server.js` (`backend/server.js`) |
| Node.js                    | 22 o 24                       |

- `npm run build` del backend compila la API (`dist/`) y, con
  [backend/scripts/build-sitio.mjs](backend/scripts/build-sitio.mjs), el sitio Angular dentro de `backend/sitio`,
  la carpeta que publica Hostinger. Instala las dependencias del frontend solo para compilar y luego las borra.
  En el registro del build debe aparecer `[sitio] Sitio listo`; si dice que no encontró el frontend, se publicó
  solo la API. Para compilar únicamente la API usa `npm run build:api` (lo hace el Dockerfile).
- Si la app se crea con la raíz del repositorio como directorio raíz, el `package.json`, `server.js` y
  [scripts/build-produccion.mjs](scripts/build-produccion.mjs) de la raíz hacen lo mismo.
- Variables de entorno mínimas: `DB_HOST=localhost`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`,
  `JWT_SECRET` (32+ caracteres), `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `TRUST_PROXY=true` y el almacenamiento:

  ```ini
  STORAGE_DRIVER=local
  # Fuera de la carpeta de la app: Hostinger la reemplaza en cada despliegue
  LOCAL_STORAGE_DIR=/home/u461260380/bienestar-archivos
  PUBLIC_FILES_BASE_URL=https://bienestarmoral.com/uploads
  ```

- No definas `PORT` (lo asigna Hostinger) ni `NODE_ENV=production` (impediría instalar las herramientas de
  compilación).
- Registros: panel de la app → **Runtime Logs** (ejecución) y **Deployments** (build).

### Alternativa: archivos por FTP

Si la API y el sitio se publican por separado, los archivos pueden subirse por FTP/FTPS a una carpeta
pública del hosting (`STORAGE_DRIVER=ftp`, `FTP_HOST`, `FTP_USER`, `FTP_PASSWORD`, `FTP_SECURE=true`,
`FTP_BASE_DIR` y `PUBLIC_FILES_BASE_URL`). Las credenciales están en hPanel → Archivos → Cuentas FTP.

## API

Lectura pública; las escrituras requieren `Authorization: Bearer <token>`.

| Método                | Ruta                            | Descripción                                    |
| --------------------- | ------------------------------- | ---------------------------------------------- |
| `POST`                | `/api/auth/login`               | Inicia sesión del administrador                |
| `GET`                 | `/api/sections?page=home`       | Secciones de una página (`home`, `about`, `services`, `human-values`, `team`, `contact`) |
| `GET`                 | `/api/navigation`               | Menú del sitio: secciones de cada página en orden |
| `GET`                 | `/api/sections/:id`             | Una sección con sus elementos                  |
| `POST` `PUT` `DELETE` | `/api/sections[/:id]`           | Crear, editar (incluye elementos) o eliminar   |
| `GET`                 | `/api/worksheets?level=primary` | Cartillas (filtro opcional: `preschool`, `primary`, `secondary`) |
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
| Páginas del menú y secciones con diseño elegible | `public/content-page`, `public/components/section-block`, `public/layout` (menú) |
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

## Contenido y diseño de las secciones

- El contenido inicial (textos de los documentos de Bienestar Moral) está en
  `backend/src/modules/site-content/domain/defaultSections.ts`. Se crea al arrancar **solo si la sección no existe**,
  así que nunca sobrescribe lo editado en el panel.
- Las fotos iniciales (portada, historia, fundadores y equipo) están optimizadas en `frontend/public/contenido` y se
  publican con el sitio. Al reemplazar una foto desde el panel, la nueva se sube al almacenamiento (Hostinger).
- Logo, emblema y favicon: `frontend/public/marca`, `frontend/public/favicon.ico` y `apple-touch-icon.png`.
- Cada página tiene una sección `intro` (encabezado) y secciones estructurales con diseño propio que se pueden editar
  pero no eliminar. Las **secciones adicionales** que se creen eligen su diseño en el panel:

  | Diseño          | Uso                                                                              |
  | --------------- | -------------------------------------------------------------------------------- |
  | Tarjetas        | Texto con imagen opcional y elementos en tarjetas                                 |
  | Personas        | Foto circular, nombre y, en la descripción, cargo (1.ª línea) y formación          |
  | Línea de tiempo | Etapas; el título «2001 – 2003 · Los comienzos» separa el periodo                  |
  | Lista numerada  | Valores, talleres...                                                             |
  | Etiquetas       | Palabras cortas (solo el título)                                                  |
  | Datos de contacto | Correos, WhatsApp, teléfonos, direcciones (abren el mapa) y enlaces             |

  Toda sección nueva aparece automáticamente en el menú de su página.
- En los textos, una línea en blanco separa párrafos y las URLs y correos se vuelven enlaces.
- Las cartillas (PDF) se suben desde el panel en cada entorno; en producción hay que cargarlas de nuevo para que
  queden en Hostinger. En el banco de valores, cada valor enlaza a sus cartillas cuando el campo «valor humano»
  coincide (p. ej. «La amistad»).

## Notas

- Al reemplazar o eliminar una cartilla se borra su archivo del hosting. Las imágenes reemplazadas en secciones **no** se borran automáticamente, porque la misma URL podría estar en uso en otra sección.
- Las descargas se cachean en `backend/storage/cache` para no ir a Hostinger en cada petición.
