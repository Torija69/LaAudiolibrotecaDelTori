# LaAudiolibrotecaDelTori

Catálogo personal de audiolibros con consulta pública y administración privada. Diseño Torija, variante Taller, con pequeños iconos de libros y fuentes locales Cabinet Grotesk y Satoshi.

- **Versión:** 1.3.1, 24 de octubre de 2026.
- **Web:** https://torija69.github.io/LaAudiolibrotecaDelTori/
- **Patrón:** web estática con Supabase.
- **Código público:** autorización expresa del propietario para publicar código y GitHub Pages.

## Qué permite

- Buscar por título, créditos y serie sin distinguir mayúsculas o tildes.
- Filtrar por tipo, serie y estado; ordenar por Excel, título, créditos o incorporación.
- Consultar fichas y ver las series en orden, con precuelas diferenciadas.
- Ver la portada, el resumen, la reseña personal y la valoración de 1 a 5 estrellas de cada libro; ordenar por mejor valorados.
- Subir, cambiar o quitar portadas desde el formulario de administración.
- Entrar con correo y contraseña de Supabase para añadir y editar.
- Crear tipos y series desde el mismo formulario, en una transacción.
- Consultar el original del Excel y las observaciones de importación solo como administrador.
- Evitar duplicados exactos y detectar ediciones concurrentes de una misma ficha.

No reproduce ni aloja archivos de audio. No ofrece registro público, borrado de fichas, recuperación de contraseña ni inteligencia artificial en ejecución. La administración de la cuenta se realiza fuera de esta aplicación; no se han modificado las opciones de autenticación compartidas con otras aplicaciones.

## Datos iniciales

Se importaron 70 filas del Excel del propietario. El número de fila del Excel se conserva internamente, pero desde la v1.3.0 el catálogo se ordena por título por defecto; no se deducen fechas ni una cronología de escucha.

Se agruparon 28 audiolibros en 9 series. Hay 31 fichas con tipo respaldado por fuentes y 39 «Sin clasificar», pendientes de revisión editorial. No se ha presentado una clasificación automática como verificada ni se han inventado créditos truncados. Los enlaces usados se muestran dentro de las fichas correspondientes.

Los títulos y créditos se conservan, incluidos errores señalados: numeración de Lluvia, Nueva primavera, autoría de Cielo en llamas y «Mayy Dinniman». El orden estructurado puede diferir del literal del Excel cuando existe una fuente, y la diferencia se explica al administrador. «Sin serie asignada» no significa que una obra sea independiente.

## Desarrollo

Requiere Node.js 22 y npm.

```sh
npm ci
npm run dev
npm run check
```

`npm run build` genera `dist/`, con rutas relativas válidas en GitHub Pages. El workflow `.github/workflows/pages.yml` comprueba y publica cada cambio en `main`.

## Supabase y seguridad

La aplicación usa tablas nuevas con prefijo `audiolibroteca_` en el proyecto existente del propietario. No modifica la tabla de dieta, usuarios, contraseñas ni configuración global de autenticación.

- La clave `sb_publishable_…` es publicable, no una credencial administrativa.
- RLS permite SELECT público de fichas, tipos y series.
- La escritura exige pertenecer a `audiolibroteca_admins`, no basta con iniciar sesión.
- Nadie puede autoasignarse administrador desde la API.
- Los originales del Excel solo se consultan con una sesión administradora.
- La RPC de guardado es `SECURITY INVOKER` y aplica RLS y autorización.
- Se escapan los valores en HTML y solo se aceptan enlaces HTTPS.
- Las portadas están en el bucket público `audiolibroteca-portadas` (solo WebP, 1 MB); subir y borrar exige ser administrador. El nombre del fichero es un UUID validado por la base de datos.
- La sesión vive en memoria; se cierra al recargar o cerrar la página.
- El Excel, datos de importación, correo e identificador del administrador y claves privadas no se incluyen en este repositorio.

La migración `supabase/migrations/20261024_01_audiolibroteca.sql` contiene únicamente estructura, índices, funciones y políticas. La asignación inicial del administrador y la carga de datos se ejecutan por separado con acceso administrativo.

## Importación y copias

`scripts/prepare-import.mjs` prepara SQL idempotente a partir de dos JSON privados. No ejecuta ni reimporta datos al arrancar la aplicación, por lo que desplegar el frontend no sobrescribe la colección.

```sh
node scripts/prepare-import.mjs /ruta/privada/original.json /ruta/privada/enrichment.json /ruta/privada/import.sql
```

Conservar el Excel y exportar periódicamente las tablas desde Supabase en un lugar privado. La política de copias automáticas depende del plan del proyecto; esta entrega no contrata ni presupone copias de pago.

## Documentación ASDLC

- `AGENTS.md`: límites de edición y seguridad.
- `docs/spec.md`: requisitos y aceptación.
- `docs/decisiones.md`: arquitectura y decisiones.
- `docs/qa.md`: alcance de las comprobaciones y limitaciones.
- `CHANGELOG.md`: historial.

El proyecto se incorpora al catálogo ASDLC y al dosier de desarrollos del propietario.
