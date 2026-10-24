# Decisiones

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

## 2026-10-24 · Carga inicial de portadas y sinopsis

- Se cargaron portadas y sinopsis de los 70 audiolibros desde Apple Books (64), Audible (5) y Storytel (1), en ediciones de audiolibro en español.
- Cada resumen termina con «Sinopsis de la editorial.». Las reseñas personales y las valoraciones no se tocaron.
- Las portadas se convirtieron a WebP (máximo 600 × 900, calidad 84) con nombre UUID, igual que el editor.
- La subida usó una Edge Function temporal protegida con secreto; después se sustituyó por una versión que responde 410. El registro de origen de cada libro está fuera del repositorio.

## 2026-10-24 · Portada grande y fin del orden del Excel (v1.3.0)

- A petición del propietario, la portada pasa a ocupar el ancho de la tarjeta en formato cuadrado, porque todas las portadas de audiolibro son cuadradas y la miniatura vertical las recortaba.
- Se retira «Orden del Excel». El orden por defecto es título A–Z, ignorando signos. `source_number` se mantiene para la trazabilidad.
