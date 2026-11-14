# Changelog

## 1.5.0 · 2026-11-14

- Nueva vista «Infografías» en la navegación (y tercer botón de vista): galería con una tarjeta por infografía, igual que las de los audiolibros, con portada de la imagen, tipo, título y autoría. Respeta la búsqueda, el orden y los filtros del catálogo. El público ve la elegida de cada libro (o todas las candidatas si no hay elegida); el administrador ve todas y la marca «Elegida».
- Pulsar una infografía de la galería abre la ficha de su libro, colocada directamente en la sección de infografías.
- Borrar desde la vista ampliada (solo administrador), con confirmación; tras borrar se pasa a la siguiente imagen y la ficha se actualiza. En móvil, anterior/siguiente quedan como flechas para dejar sitio a «Borrar».
- Sin cambios en la base de datos.

## 1.4.0 · 2026-11-14

- Galería de infografías en la ficha de cada libro. El público ve la infografía elegida; si aún no hay elegida, ve todas las candidatas en su orden. Cada imagen se amplía en una vista con anterior/siguiente (también con las flechas del teclado) y enlace al tamaño original.
- Administración en la misma ficha: elegir o quitar la elegida (como mucho una por libro), reordenar, borrar con confirmación (borra fila e imagen) y añadir nuevas imágenes, que se reducen a 2000 px y 3 MB en WebP (JPEG en iPhone).
- Nuevo filtro «Infografía» en Más filtros (con / sin) y pequeño icono en las tarjetas que tienen infografía.
- Migración 06: tabla `"Audiobiblioteca".audiolibroteca_infografias` con RLS (lectura pública, escritura solo administradores), índice único de una elegida por libro y bucket público `audiolibroteca-infografias` (WebP/JPEG, 3 MB) con escritura y borrado solo de administradores.

## 1.3.2 · 2026-10-25

- Cinco tablas y cuatro funciones trasladadas al esquema propio `"Audiobiblioteca"`, con los datos, permisos y dependencias conservados.
- Cliente Supabase configurado explícitamente para consultas y RPC en ese esquema; Auth y Storage conservan sus rutas.
- API ampliada al nuevo esquema sin retirar `public`, utilizado por Dieta.
- Preparador de importación actualizado y prueba de regresión de cabeceras de esquema. Recargar las pestañas antiguas tras la migración.

## 1.3.1 · 2026-10-25

- Corrige la subida de portadas desde iPhone/iPad: Safari no codifica WebP desde canvas y devolvía PNG, que se rechazaba. Ahora, si el navegador no genera WebP, la portada se guarda en JPEG. Migración 04: el bucket admite image/jpeg y cover_path acepta .jpg.
- Lectura de imagen con alternativa mediante <img> si createImageBitmap falla.
- El error de portada se muestra junto a la portada, no al final del formulario.

## 1.3.0 · 2026-10-24

- Portada grande y cuadrada en la parte superior de cada tarjeta de la cuadrícula; icono de libro sobre fondo verde cuando no hay portada.
- Se elimina el orden «Orden del Excel»; el catálogo se ordena por título A–Z por defecto, sin tener en cuenta paréntesis ni signos (los Blackwater van en la B). El número de fila del Excel se sigue conservando para la trazabilidad del administrador.

## 1.2.0 · 2026-10-24

- Nuevo filtro público «Valoración» en «Más filtros»: todas, sin valorar o valorados. Se combina con el resto de filtros y se limpia al restablecerlos.

## 1.1.0 · 2026-10-24

- Portada por audiolibro: se sube desde el formulario, se reduce en el navegador a WebP (máx. 600×900 px, 1 MB) y se guarda en el bucket público `audiolibroteca-portadas`. Se puede cambiar o quitar; la imagen anterior se elimina.
- Resumen del libro y reseña personal, públicos, de hasta 5000 caracteres cada uno.
- Valoración de 1 a 5 estrellas o «Sin valorar», visible en tarjetas y fichas, y orden «Mejor valorados».
- Nueva función `audiolibroteca_save_book_v2` con las mismas protecciones: allowlist, RLS, conflicto de versión y duplicados.
- Solo el administrador puede subir o borrar portadas; los 70 audiolibros existentes se conservan.

## 1.0.0 · 2026-10-24

- Catálogo público con búsqueda, tipos, estados, ordenación y vista de series.
- 70 audiolibros importados, 9 series identificadas y originales privados conservados.
- Primera clasificación documentada de 31 títulos; 39 quedan sin clasificar.
- Alta y edición de administrador con Supabase Auth, lista de autorizados y RLS.
- Guardado atómico de libro, tipo y serie; protección de duplicados y conflictos.
- Diseño Torija Taller, fuentes locales e iconos de libros.
- GitHub Pages, CI, pruebas y documentación ASDLC.
- Integración en el catálogo de proyectos y el dosier de desarrollos.
