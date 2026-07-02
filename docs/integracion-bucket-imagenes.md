# Integración de un bucket para imágenes en el frontend

## 1. Contexto y objetivo

Hoy el formulario de registro de libros
(`app/books/register/_components/RegisterBookForm.tsx`) pide una **URL de
portada** que el bibliotecario tiene que pegar a mano en el campo `coverUrl`.
Esa URL se manda al backend como `cover_url` dentro del payload de
`registerBook()` (`lib/api/books.ts`).

```
Usuario pega URL  →  input coverUrl  →  registerBook()  →  backend (cover_url)
```

**Objetivo:** cambiar ese flujo por uno donde el bibliotecario **selecciona un
archivo de imagen**, el frontend lo **sube a un bucket** de almacenamiento de
objetos, obtiene la **URL pública** del archivo, y **solo esa URL** se envía al
backend. El backend nunca ve el binario; sigue recibiendo un `cover_url` como
hasta ahora.

```
Usuario elige archivo  →  subida al bucket  →  URL pública  →  input coverUrl  →  registerBook()  →  backend (cover_url)
```

Esto no requiere cambios en el backend ni en el contrato de la API: `cover_url`
sigue siendo un string. Solo cambia de dónde sale ese string.

### Restricciones del stack actual

- **Next.js 16 / React 19 / TypeScript** (App Router, componentes client).
- El formulario ya es un client component (`"use client"`).
- La sesión y el `accessToken` viven en el cliente (`lib/auth/session.ts`).
- El registro de libros solo lo hacen bibliotecarios (rol validado en el form).

---

## 2. Opciones evaluadas

| Opción | Coste inicial | Facilidad en el front | Requiere backend | Reglas de acceso | Recomendado para |
|---|---|---|---|---|---|
| **Firebase Storage** | Gratis (plan Spark) | Alta (SDK JS oficial) | No | Security Rules | **Este proyecto** |
| Supabase Storage | Gratis generoso | Alta (SDK JS) | No | RLS / policies | Si ya usaras Supabase |
| Cloudinary | Gratis (con marca) | Media (unsigned upload) | No | Upload presets | Transformaciones de imagen |
| AWS S3 (presigned URL) | Muy bajo | Media | **Sí** | IAM + firmas | Control total / escala |
| UploadThing | Gratis limitado | Muy alta | Endpoint propio | Middleware propio | Prototipos rápidos en Next |

A continuación el detalle de cada una.

---

### Opción A — Firebase Storage (recomendada)

**Por qué encaja aquí:** subida 100% desde el navegador con el SDK oficial, sin
montar backend de subida, plan gratuito suficiente para un proyecto académico,
y devuelve directamente una URL pública descargable que es justo lo que el
backend espera.

**Cómo funciona el flujo:**

1. El usuario elige un archivo en el `<input type="file">`.
2. El SDK sube el archivo a un `ref` del bucket (`covers/<uuid>.jpg`).
3. Se llama a `getDownloadURL()` para obtener la URL pública.
4. Esa URL se pone en `form.coverUrl` y se envía con `registerBook()`.

**Ventajas**
- Sin servidor de subida propio.
- SDK bien documentado, tipado, integrable en un client component.
- URL pública estable y cacheable vía CDN de Google.
- Control de acceso por Security Rules (p. ej. solo escritura autenticada).

**Desventajas / cuidados**
- La config del cliente (`apiKey`, etc.) es **pública** — eso es normal en
  Firebase; la seguridad real está en las **Storage Rules**, no en ocultar la
  key.
- Hay que configurar CORS del bucket si sirves desde otro dominio (gestionado
  por Firebase Hosting; con dominios externos se ajusta con `gsutil cors`).
- Acopla el proyecto al ecosistema Firebase.

**Coste:** plan Spark gratuito (5 GB almacenados, ~1 GB/día de descarga). De
sobra para portadas.

---

### Opción B — Supabase Storage

Muy parecida a Firebase pero sobre Postgres/S3. SDK JS (`@supabase/supabase-js`)
con `supabase.storage.from('covers').upload(...)` y
`getPublicUrl(...)`. Control de acceso mediante políticas RLS.

- **A favor:** open source, buen free tier, si en algún momento usas Supabase
  para auth/DB queda todo unificado.
- **En contra:** introducir Supabase solo para imágenes es sobredimensionado si
  no lo usas para nada más.

---

### Opción C — Cloudinary

Servicio especializado en imágenes. Permite **unsigned uploads** desde el
navegador con un *upload preset*, y de regalo ofrece transformaciones on-the-fly
(resize, recorte, WebP, optimización automática) por URL.

- **A favor:** ideal si quieres miniaturas/optimización de portadas sin código.
- **En contra:** el free tier añade límites de créditos; unsigned upload hay que
  restringirlo bien (carpeta, formatos, tamaño) para que no lo abusen.

---

### Opción D — AWS S3 con URL prefirmada (presigned URL)

El estándar "serio". El navegador **no** sube directo con credenciales: pide al
backend una **URL prefirmada**, y con ella hace un `PUT` del archivo a S3.

```
front → backend (pide presigned URL) → S3 PUT → URL pública → coverUrl
```

- **A favor:** control total, barato a escala, credenciales nunca salen del
  servidor.
- **En contra:** **requiere un endpoint en el backend** que genere la firma, lo
  que rompe la premisa de "solo desde el front". Más setup (IAM, bucket policy,
  CORS).

---

### Opción E — UploadThing

Librería pensada para Next.js. Defines un *file router*, ella gestiona la subida
y te devuelve la URL. Requiere un pequeño endpoint (route handler) en el propio
Next.

- **A favor:** DX excelente, componente `<UploadButton>` listo, muy poco código.
- **En contra:** dependencia de un servicio externo más; menos control fino.

---

## 3. Recomendación

Para este proyecto: **Firebase Storage (Opción A)**.

Motivos: cumple exactamente lo pedido (subir desde el front y mandar solo la URL
al backend), no obliga a tocar el backend, tiene free tier suficiente y su SDK
se integra limpiamente en el client component que ya existe. Si más adelante
necesitas optimización/transformación de imágenes, Cloudinary sería el
siguiente candidato.

---

## 4. Guía de implementación con Firebase Storage

### 4.1. Crear el proyecto y el bucket

1. En [console.firebase.google.com](https://console.firebase.google.com) crea un
   proyecto (o reutiliza uno).
2. Menú **Build → Storage → Get started**. Elige la ubicación del bucket.
3. En **Project settings → General → Your apps**, registra una app **Web** y
   copia el objeto `firebaseConfig`.

### 4.2. Instalar la dependencia

```bash
cd frontend
npm install firebase
```

### 4.3. Variables de entorno

Crea/edita `frontend/.env.local` (no lo subas al repo; añade `.env.local` a
`.gitignore` si no está):

```env
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu-proyecto
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxx
NEXT_PUBLIC_FIREBASE_APP_ID=xxx
```

> El prefijo `NEXT_PUBLIC_` es obligatorio para exponerlas al navegador. En
> Firebase estas claves son públicas por diseño; la protección va en las Rules
> (paso 4.6).

### 4.4. Inicializar Firebase — `lib/firebase.ts`

```ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Evita reinicializar en hot-reload / múltiples imports.
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const storage = getStorage(app);
```

### 4.5. Helper de subida — `lib/api/upload.ts`

```ts
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

export class UploadError extends Error {}

/**
 * Sube una portada al bucket y devuelve su URL pública.
 * Solo la URL se envía luego al backend como cover_url.
 */
export async function uploadCover(file: File): Promise<string> {
  if (!ACCEPTED.includes(file.type)) {
    throw new UploadError("Formato no permitido. Usa JPG, PNG o WebP.");
  }
  if (file.size > MAX_BYTES) {
    throw new UploadError("La imagen supera el máximo de 5 MB.");
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `covers/${crypto.randomUUID()}.${ext}`;
  const storageRef = ref(storage, path);

  try {
    await uploadBytes(storageRef, file, { contentType: file.type });
    return await getDownloadURL(storageRef);
  } catch {
    throw new UploadError("No se pudo subir la imagen. Intenta de nuevo.");
  }
}
```

### 4.6. Reglas de seguridad del bucket (Storage Rules)

En **Storage → Rules**. Estas son la barrera real de seguridad. Ejemplo:
lectura pública (las portadas se ven en el catálogo) y escritura solo para
usuarios autenticados en Firebase, limitando tamaño y tipo:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /covers/{file} {
      allow read: if true;
      allow write: if request.auth != null
        && request.resource.size < 5 * 1024 * 1024
        && request.resource.contentType.matches('image/.*');
    }
  }
}
```

> ⚠️ Nota importante: tu app **no** usa Firebase Auth (usa tu propio backend con
> JWT). Con la regla `request.auth != null` necesitarías autenticar contra
> Firebase también, p. ej. con **signInAnonymously()** o **custom tokens**. Dos
> caminos:
>
> - **Rápido (proyecto académico):** dejar `allow write: if true` con límites de
>   tamaño/tipo. Simple, pero cualquiera con la config podría subir. Aceptable
>   para una demo, no para producción.
> - **Correcto:** `signInAnonymously()` al cargar el form y exigir
>   `request.auth != null` en las Rules, o emitir *custom tokens* de Firebase
>   desde tu backend para atar la subida al bibliotecario real.

### 4.7. Cambios en el formulario — `RegisterBookForm.tsx`

Reemplaza el input de texto de `coverUrl` (líneas ~276–290) por un input de
archivo que sube y guarda la URL en el mismo campo `form.coverUrl`. El resto del
formulario y la llamada a `registerBook()` **no cambian**, porque siguen
enviando `coverUrl` como string.

Añade estado para la subida:

```tsx
const [isUploading, setIsUploading] = useState(false);
const [uploadError, setUploadError] = useState<string | null>(null);
```

Handler:

```tsx
import { uploadCover, UploadError } from "@/lib/api/upload";

async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
  const file = event.target.files?.[0];
  if (!file) return;

  setUploadError(null);
  setIsUploading(true);
  try {
    const url = await uploadCover(file);
    updateField("coverUrl", url); // guarda solo la URL
  } catch (err) {
    setUploadError(
      err instanceof UploadError ? err.message : "Error al subir la imagen.",
    );
  } finally {
    setIsUploading(false);
  }
}
```

Nuevo bloque JSX (sustituye al `<input id="coverUrl" .../>`):

```tsx
<div className="flex flex-col gap-1.5">
  <label htmlFor="cover" className={labelClassName}>
    Portada
  </label>
  <input
    id="cover"
    type="file"
    accept="image/jpeg,image/png,image/webp"
    onChange={handleFileChange}
    disabled={isSubmitting || isUploading}
    className={inputClassName}
  />
  {isUploading ? (
    <p className="text-xs text-zinc-500 dark:text-zinc-400">Subiendo imagen…</p>
  ) : null}
  {uploadError ? (
    <p role="alert" className="text-xs text-red-600 dark:text-red-400">
      {uploadError}
    </p>
  ) : null}
  {form.coverUrl ? (
    // Vista previa. Si usas next/image, añade el dominio a next.config.ts.
    <img
      src={form.coverUrl}
      alt="Vista previa de la portada"
      className="mt-1 h-40 w-auto rounded-md border border-zinc-200 object-cover dark:border-zinc-700"
    />
  ) : null}
</div>
```

Ajusta la validación `requiredFilled` para deshabilitar el submit mientras se
sube o si aún no hay URL:

```tsx
const requiredFilled =
  form.title.trim() &&
  // ...resto igual...
  form.coverUrl.trim() &&        // ahora la URL viene de la subida
  !isUploading &&                // no permitir enviar a mitad de subida
  // ...resto igual...
  Number(form.pageCount) >= 1;
```

### 4.8. (Opcional) `next/image` para las portadas

Si en el catálogo (`BookCover.tsx`) muestras las portadas con `next/image`,
añade el dominio de Firebase a `next.config.ts`:

```ts
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
    ],
  },
};
```

---

## 5. Checklist de integración

- [ ] Proyecto Firebase creado y Storage habilitado.
- [ ] `npm install firebase` en `frontend/`.
- [ ] Variables `NEXT_PUBLIC_FIREBASE_*` en `.env.local` (y `.env.local` en `.gitignore`).
- [ ] `lib/firebase.ts` y `lib/api/upload.ts` creados.
- [ ] Input de archivo + vista previa en `RegisterBookForm.tsx`.
- [ ] `requiredFilled` bloquea el envío durante la subida.
- [ ] Storage Rules configuradas (límite de tamaño/tipo; decidir estrategia de auth).
- [ ] Dominio de Firebase añadido a `next.config.ts` si se usa `next/image`.
- [ ] Probar: subir imagen → ver preview → registrar libro → confirmar que el
      catálogo muestra la portada desde la URL del bucket.

---

## 6. Notas de seguridad y buenas prácticas

- **La config del cliente es pública.** No confíes en ocultarla; protege con
  Storage Rules (tamaño, tipo, auth).
- **Valida en el cliente y en las Rules.** El check de tamaño/tipo en JS mejora
  la UX pero se puede saltar; las Rules son la barrera real.
- **Nombres de archivo con UUID** (ya incluido) para evitar colisiones y no
  filtrar nombres originales.
- **Limpieza de huérfanos:** si un usuario sube una portada pero no termina de
  crear el libro, la imagen queda en el bucket. Para un proyecto académico es
  aceptable; en producción se resuelve con una Cloud Function que borre archivos
  no referenciados o subiendo solo tras confirmar el registro.
- **CORS:** si sirves desde un dominio distinto y da error de CORS al subir,
  configura el bucket con `gsutil cors set cors.json gs://<bucket>`.
