# Decisiones

## 2026-10-25 · Esquema propio (v1.3.2)

El propietario solicita y autoriza el traslado de las cinco tablas desde `public` al esquema exacto `"Audiobiblioteca"`, la adaptación y las pruebas de la aplicación y su publicación en GitHub Pages. Se trasladan también las cuatro funciones, conservando sus OID para no romper las dependencias de RLS, triggers y Storage, y se actualizan las referencias SQL de sus cuerpos. No se crean copias ni vistas de compatibilidad en `public`; las pestañas anteriores requieren recarga.

Se preservan los privilegios existentes y se concede únicamente USAGE sobre el nuevo esquema. La exposición de la API se amplía de `public` (valor comprobado antes de migrar) a `public, Audiobiblioteca`, manteniendo Dieta. Auth no cambia. La transacción verifica igualdad de contenido, filas, OID, RLS, políticas y ACL antes de confirmar.

## Arquitectura

Frontend estático Vite y JavaScript, Supabase para persistencia y autenticación, GitHub Pages para alojamiento. No se incorpora un servidor de aplicación cuando las operaciones caben en una RPC con RLS; reduce piezas y evita depender de conectores de desarrollo en producción.

## Autorizaciones del propietario

El 24 de octubre de 2026 autorizó el desarrollo completo, importación, publicación y actualización del catálogo y dosier. Cambió el nivel a Alto antes del desarrollo y pidió pequeños iconos de libros. Después autorizó explícitamente repositorio público, reutilización del proyecto Supabase y cuenta existentes.

No se contratan servicios. No se cambia la configuración global de Auth ni la tabla de dieta. La autorización de administrador se almacena solo en la base de datos.

## Identidad visual

Se reutiliza el kit local de Torija Taller. Iconos Lucide, tipografía y superficie homogénea: las fichas no fingen ser portadas oficiales y no se descargan imágenes de terceros.

## Metadatos e importación

El Excel no contiene un campo de tipo ni una estructura normalizada de series. Se verifica una primera agrupación con referencias visibles; lo no confirmado queda explícitamente pendiente. Se mantienen los literales originales en una tabla privada inmutable desde la API.

La posición 0 identifica una precuela para el orden de consulta, no una afirmación de que sea el primer libro publicado. Los números del Excel no se interpretan como fechas.

## Portadas, reseñas y valoración (v1.1.0)

El propietario pidió portadas, resumen, reseña personal y estrellas, y decidió que todo sea público. Las imágenes se redimensionan en el navegador a WebP para no depender de un servidor de procesamiento y mantener el bucket pequeño. Se usa un bucket propio, independiente del de Dieta, con escritura solo para la allowlist. Se crea `audiolibroteca_save_book_v2` en lugar de modificar la función original; la anterior se conserva por compatibilidad, no toca los campos nuevos y mantiene sus permisos. Las estrellas son enteras (1–5) y opcionales. Desarrollado con el nivel Estándar elegido por el propietario.

## Seguridad

RLS en todas las tablas; lectura pública solo del catálogo normalizado. Autenticación no implica autorización: una lista de administradores independiente controla la escritura.

La función de comprobación de administrador es `SECURITY DEFINER` de solo lectura con `search_path` vacío; la RPC de guardado es `SECURITY INVOKER`. No hay permiso DELETE y las importaciones originales no se pueden editar desde el cliente.

La creación de tipo, serie y ficha se hace en una transacción. `updated_at` funciona como control optimista en edición. El cliente explica los conflictos y no reintenta sobreescribiendo.

La sesión se mantiene en memoria, sin cookies ni almacenamiento persistente. Así se evita compartir una sesión con otra aplicación y se soporta la vista previa aislada, a cambio de pedir login tras una recarga.

## Modelo

Se ha usado el nivel Alto elegido por el propietario para la implementación y revisión. La aplicación no necesita un modelo de IA ni genera consumo de inferencia durante su uso normal.

## 2026-11-14 · Carga inicial de infografías

- 54 candidatas de 5 libros (Cleopatra 24, Fuego en el Misisipi 15, Un hombre de honor 7, Cuentos completos 7, Momo 1), procedentes de artefactos y chats de Perplexity y de la biblioteca de Leonardo. Ninguna se marca como elegida: la elección es del propietario.
- Duplicados exactos entre Perplexity y Leonardo descartados por huella perceptiva; se conservó la versión de mayor resolución. Las versiones distintas de una misma infografía se conservan como candidatas.
- Convertidas a WebP (máximo 2000 px, calidad 85, 30,3 MB en total) con nombre UUID. Subida con una Edge Function temporal protegida con secreto, sustituida después por una versión que responde 410. El registro de origen de cada imagen está fuera del repositorio.

## 2026-10-24 · Carga inicial de portadas y sinopsis

- Se cargaron portadas y sinopsis de los 70 audiolibros desde Apple Books (64), Audible (5) y Storytel (1), en ediciones de audiolibro en español.
- Cada resumen termina con «Sinopsis de la editorial.». Las reseñas personales y las valoraciones no se tocaron.
- Las portadas se convirtieron a WebP (máximo 600 × 900, calidad 84) con nombre UUID, igual que el editor.
- La subida usó una Edge Function temporal protegida con secreto; después se sustituyó por una versión que responde 410. El registro de origen de cada libro está fuera del repositorio.

## 2026-10-24 · Portada grande y fin del orden del Excel (v1.3.0)

- A petición del propietario, la portada pasa a ocupar el ancho de la tarjeta en formato cuadrado, porque todas las portadas de audiolibro son cuadradas y la miniatura vertical las recortaba.
- Se retira «Orden del Excel». El orden por defecto es título A–Z, ignorando signos. `source_number` se mantiene para la trazabilidad.

## 2026-10-25 · JPEG como alternativa en iOS (v1.3.1)

- Safari en iOS no codifica WebP desde canvas. Con aprobación expresa del propietario se aplicó la migración 04: el bucket admite JPEG y `cover_path` acepta `.jpg`. Se descartó un codificador WebP en WASM porque obligaba a relajar la CSP y aumentaba el peso de la web.

## 2026-11-14 · Infografías por libro (v1.4.0)

- Tabla `audiolibroteca_infografias` en `"Audiobiblioteca"`: se mantiene el prefijo `audiolibroteca_` que exige AGENTS.md, aunque la guía del infografista la llamaba `infografias`.
- Una fila por imagen con `elegida` booleano y un índice único parcial: como mucho una elegida por libro, garantizado por la base de datos. Elegir libera primero la anterior.
- Sin elegida, el público ve todas las candidatas para que la galería no quede vacía mientras el propietario decide. Con elegida, solo esa.
- Bucket aparte (`audiolibroteca-infografias`, 3 MB, WebP/JPEG) para no mezclar límites ni políticas con las portadas (1 MB).
- Borrar elimina primero la fila (RLS) y después el fichero; si el fichero fallara, queda huérfano pero invisible. Solo el propietario borra, con confirmación por imagen.
- La migración es solo aditiva: no toca tablas existentes, Dieta ni otros buckets.

## 2026-11-14 · Galería de infografías (v1.5.0)

- Petición del propietario: que las infografías se vean «igual que los audiolibros» y que lleven al libro. Se añade una tercera vista con tarjetas del mismo estilo; la tarjeta abre la ficha (no la vista ampliada), colocada en la galería del libro.
- La galería pública sigue la regla de la v1.4.0 (elegida o, si no hay, todas las candidatas) para no enseñar descartes.
- Borrar también desde la vista ampliada, con la misma confirmación por imagen; no hay borrado múltiple.
