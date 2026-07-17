---
name: add-brand
description: Registra una marca nueva en el catálogo estático de layout-studio. Crea apps/web/public/brands/<slug>/ con brand.json, logo y las 5 fuentes TTF, y actualiza index.json para que aparezca en el dropdown de la web. Úsala cuando el usuario diga /add-brand o pida "añadir una marca", "crear un brand nuevo", "registrar identidad de cliente X".
---

# add-brand

Añade una marca nueva al catálogo estático `apps/web/public/brands/`. El motor renderiza con `BrandConfig` (colores, fuentes, logo), así que necesitamos esos tres bloques de información para cada marca.

## Datos necesarios

Si el usuario no los ha pasado en el mensaje, pregúntalos con `AskUserQuestion`, agrupando los relacionados (máximo 4 preguntas por turno):

### Identidad
- `slug` — kebab-case, lowercase, sin espacios (ej. `acme`, `the-power`). Es el id en URLs y nombres de carpeta.
- `name` — nombre display (ej. "Acme Corp"). Va a cabeceras del PDF.

### Colores corporativos
Tres obligatorios (resto opcionales con defaults sensatos):
- `primary_dark` — color principal oscuro. Hex (`#003D6B`).
- `primary_light` — variante clara para acentos sutiles.
- `primary_mid` — tono intermedio para títulos secundarios.

Si solo te dan uno o dos, sugiere derivar los faltantes:
- `primary_mid` ≈ mezcla 50/50 de dark y light.
- `primary_light` ≈ versión muy desaturada de dark (mostrar opciones y dejar elegir).

### Tipografía
- `font_family` — nombre con el que se registrarán en ReportLab (ej. "Inter", "Poppins"). Lo usa el motor internamente; el usuario solo necesita decirlo.
- 5 ficheros TTF (regular, bold, medium, light, italic). Pide rutas absolutas en disco.

**Si faltan variantes**: sustituye por la más cercana y avisa al usuario. Mapeos por defecto:
- Sin `medium` → usa `regular`.
- Sin `light` → usa `regular`.
- Sin `italic` → usa `regular` (el motor no diferenciará cursivas).
- Sin `bold` → es crítico, pide otra vez.

### Logo
- `logo_path` — ruta absoluta al **logo completo** (PNG transparente, alto ≥ 400 px). Va impreso en el footer del PDF. Acepta también SVG/JPG/WEBP.
- `icon_path` — opcional pero recomendado. Ruta a un **icono cuadrado** (solo el símbolo/mark, sin texto, ~256 px). Se usa en el selector de marcas de la web. Si no se proporciona, el dropdown cae a usar `logo_path` (queda apretado si el logo es ancho).
- `logo_fallback_text` — opcional. Texto que se dibuja si el logo no carga.
- `document_author` — opcional. Va en los metadatos del PDF.

## Procedimiento

1. **Validar slug**: que sea kebab-case (`^[a-z][a-z0-9-]*$`) y que **no exista ya** en `apps/web/public/brands/index.json`. Si existe, preguntar al usuario si sobreescribe (no sobreescribir nunca sin confirmación explícita).

2. **Crear estructura**:
   ```
   apps/web/public/brands/<slug>/
   ├── brand.json
   ├── logo.<ext>          # extensión original del fichero pasado
   ├── icon.<ext>          # solo si se proporcionó icon_path
   └── fonts/
       ├── regular.ttf
       ├── bold.ttf
       ├── medium.ttf
       ├── light.ttf
       └── italic.ttf
   ```

3. **Copiar binarios** con `cp` vía Bash (no leer y reescribir, para preservar bytes intactos). Cuando una variante de fuente esté duplicada por sustitución, también `cp` desde el origen.

4. **Escribir `brand.json`** con esta forma (omitir campos opcionales si están vacíos). El contrato lo define `apps/web/public/brands/brand.schema.json` (incluir `$schema` da validación en el editor); el validador autoritativo en runtime es `apps/web/src/lib/brand-schema.ts`:
   ```json
   {
       "$schema": "../brand.schema.json",
       "slug": "<slug>",
       "name": "<name>",
       "colors": {
           "primary_dark": "#…",
           "primary_light": "#…",
           "primary_mid": "#…"
       },
       "font_family": "<font_family>",
       "font_files": {
           "regular": "fonts/regular.ttf",
           "bold": "fonts/bold.ttf",
           "medium": "fonts/medium.ttf",
           "light": "fonts/light.ttf",
           "italic": "fonts/italic.ttf"
       },
       "logo_file": "logo.<ext>",
       "icon_file": "icon.<ext>",
       "logo_fallback_text": "<opcional>",
       "document_author": "<opcional>"
   }
   ```

5. **Actualizar `index.json`**: añadir el nuevo `slug` al array `brands`, manteniendo el orden alfabético.

6. **Resumen final**: muestra al usuario qué se creó, en qué paths, y si hubo sustituciones de fuentes.

7. **No commitear automáticamente**. Sugiere `git add apps/web/public/brands/<slug>/ apps/web/public/brands/index.json && git commit -m "feat(brands): añadir <slug>"` para que confirme.

8. **Avisar de recarga**: si el dev server está corriendo, la marca aparece tras un refresh de la página (Cmd+Shift+R).

## Validaciones extra

- Si el logo no es PNG/JPG/SVG/WEBP, avisar.
- Si algún color no encaja con `^#[0-9A-Fa-f]{6}$`, pedir corrección.
- **Solo claves de color permitidas** dentro de `colors` (las del schema: `primary_dark/light/mid`, `text`, `text_soft`, `line`, `bg_soft`, `quote_bg`, `white`, `table_header_bg`, `header_rule`, `footer_rule`, `heading`, `page_number`). Una clave desconocida rompe el motor (`BrandColors(**colors)`), así que el validador la rechaza al cargar.
- Si alguna fuente TTF no existe en disco, abortar con mensaje claro.
- Si `font_family` tiene espacios o caracteres raros, advertir (ReportLab los acepta pero confunde).
- El `slug` del `brand.json` debe coincidir con el nombre de la carpeta.

## Ejemplo de invocación

```
/add-brand
```

→ pregunto identidad → colores → fuentes → logo → creo todo → resumen.

O con todo en el mensaje (atajo):
```
/add-brand acme #102A43 #BCCCDC #486581 fonts: ~/Downloads/Inter*.ttf logo: ~/Downloads/acme-logo.png
```

→ parseo lo que pueda, pregunto lo que falte.
