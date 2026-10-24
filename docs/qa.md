# Comprobaciones

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
