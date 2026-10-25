# Comprobaciones

## Versión 1.3.2

- Migración aplicada: cinco tablas y cuatro funciones en `"Audiobiblioteca"`; ninguna tabla de la aplicación permanece en `public`.
- Comprobaciones en la transacción: mismas filas, huellas de contenido, OID, RLS, políticas y ACL de las cinco tablas. Conservados: 74 libros, 9 tipos, 9 series, 70 originales importados y 1 administrador.
- `public.dietas` mantiene 8 registros; la migración no contiene instrucciones de modificación sobre ella.
- Data API con `Accept-Profile: Audiobiblioteca`: lectura correcta, 74 libros. El cliente selecciona el esquema para tablas, RPC y originales; Auth y Storage conservan sus rutas.
- Prueba SQL con `ROLLBACK`: anónimo lee libros, no lee originales ni escribe; autenticado no administrador no ve originales ni guarda por RPC o escritura directa; administrador ve originales y crea/edita mediante RPC v2 con género y serie nuevos, resumen, reseña, estrellas y ruta de portada. Trigger `updated_at`, control CONFLICT y RPC anterior correctos. No quedan datos de prueba.
- Políticas Storage siguen resolviendo `"Audiobiblioteca".audiolibroteca_is_admin()` por identidad de función; se conservan bucket y lectura pública.
- 16 pruebas automatizadas y compilación de producción correctas con Node 22. La nueva prueba intercepta seis consultas/RPC y comprueba Accept-Profile/Content-Profile y la URL pública de Storage.
- GitHub Actions: comprobaciones y publicación correctas.
- Chromium sobre GitHub Pages: 74 fichas, búsqueda de Cleopatra y apertura de ficha, nueve agrupaciones de serie y apertura de libro, combinación de estado/valoración, limpieza de filtros, orden por autor, formulario de administración, búsqueda sin resultados y recuperación tras fallo de conexión. Todas las consultas observadas envían `Accept-Profile: Audiobiblioteca`; sin errores JavaScript. Capturas a 1440 y 375 px, sin desbordamiento horizontal en móvil.
- Verificación final en SQL: 74 libros, cero registros de prueba en libros/tipos/series y cero tablas `audiolibroteca_` en `public`.
- No se inicia sesión con la cuenta real del propietario ni se sube una portada real; la prueba de administración usa el rol autenticado y las claims del administrador en SQL dentro de una transacción revertida.

## Versión 1.3.1

- 15 pruebas unitarias.
- Chromium simulando Safari (toBlob WebP devuelve PNG): foto 4032 × 3024 de 1,6 MB pasa a JPEG 600 × 450 de 136 KB; en Chromium normal sale WebP de 94 KB. Archivo no legible: mensaje claro.
- Base real tras la migración 04: bucket con image/webp e image/jpeg, restricción de cover_path con webp|jpg, Dieta con 8 filas sin cambios.
- WebKit no se puede instalar en el entorno de pruebas; pendiente la prueba real del propietario desde el iPhone.

## Versión 1.3.0

- 15 pruebas unitarias, incluido el orden por defecto por título ignorando signos.
- Navegador con datos reales a 1280, 768 y 375 px: portada cuadrada a lo ancho de cada tarjeta, sin desbordamiento ni errores de consola; el selector ya no ofrece «Orden del Excel».

## Versión 1.2.0

- 14 pruebas unitarias, incluida la del filtro de valoración (sin valorar, valorados y sin filtro).
- Navegador con datos reales: 31 sin valorar y 39 valorados de 70, se combina con el resto de filtros, sin errores de consola y sin desbordamiento en escritorio ni a 375 px.

## Versión 1.1.0

- 13 pruebas unitarias, incluidas validación de resumen, reseña y estrellas y orden por valoración.
- Base real con rollback: autenticado no administrador no puede guardar ni subir portadas; administrador guarda resumen, reseña, valoración y portada, edita y las quita. Se rechazan estrellas fuera de 1–5 y rutas de portada no válidas. 70 libros y Dieta (8 filas) sin cambios.
- Navegador con autenticación y Storage simulados: subida de imagen redimensionada a WebP, cambio con borrado de la anterior, eliminación, estrellas, reseña con HTML escapado, orden «Mejor valorados», escritorio y 375 px sin desbordamiento.
- Pendiente: primera subida real de portada con la cuenta del propietario.

# Versión 1.0.0

## Automatizadas

`npm run check`: 11 pruebas unitarias y compilación Vite. Se cubren normalización, escape HTML, protocolos de enlaces, filtros combinados, búsqueda, orden de series, precuelas, orden del Excel y validación de formularios.

## Base de datos real

Comprobadas en el proyecto Supabase con transacciones y rollback:

- Anónimo: ve 70 libros; no tiene INSERT ni acceso a originales.
- Autenticado no administrador: no ve originales, no puede insertar tipos ni ejecutar guardado autorizado.
- Administrador: puede crear tipo, serie y libro en una transacción, editarlo y consultar originales.
- Conflicto de versión: una edición con `updated_at` antiguo se rechaza.
- Duplicado exacto: se rechaza con restricción única.
- Pruebas con registros temporales dentro de rollback: no quedan fichas de prueba.
- Recuento preservado: 70 libros, 70 originales y un administrador; tabla de dieta preexistente con 8 filas, sin cambios.

Estas pruebas usan los roles PostgreSQL y claims de sesión para verificar RLS. No equivalen a iniciar sesión con la contraseña real del propietario.

## Navegador

Se prueban navegación pública, filtros, búsqueda sin tildes, ficha, salto a serie, precuela, estado vacío, login fallido, teclado, escritorio y móvil a 375 px. También se comprueba que no haya desbordamiento horizontal.

La pantalla de administrador se prueba con respuestas de autenticación y guardado simuladas en un contexto aislado de Playwright. La autorización y la escritura se prueban por separado contra la base real. No se conoce, recopila ni cambia la contraseña del propietario.

## Límite de verificación

El primer acceso real del propietario con su cuenta y contraseña queda como comprobación final de aceptación. No se añaden cuentas de prueba ni se alteran opciones compartidas de autenticación para simularlo.

## Metadatos

Hay 31 tipos contrastados y 39 pendientes. Se marcan además créditos truncados y discrepancias del Excel; no se afirma que la catalogación bibliográfica sea exhaustiva.
