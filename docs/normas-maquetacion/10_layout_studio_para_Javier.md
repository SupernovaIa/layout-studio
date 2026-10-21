# 10 · Cómo encaja todo esto en Layout Studio

> Para Javier Carreira y quien mantenga la herramienta. Resume qué hace hoy Layout Studio (verificado en la web y en el repositorio público), en qué difiere de nuestras normas de maquetación y qué ficheros de esta memoria se pueden usar directamente como entrada: marcas (`brand.json`), ajustes de página, un `.md` de prueba con todos los elementos y una lista de validaciones posibles.

## 10.1 Qué es y qué hace hoy

Herramienta web (`https://layout-studio.tools.thepower.education/`) que convierte **un `.md` en PDF o Word** (o **una carpeta de `.md` con sus imágenes en un ZIP**) con la identidad de una marca. Todo se ejecuta **en el navegador** (motor Python con Pyodide); las marcas son ficheros estáticos.

| Opción de la interfaz | Valores |
|---|---|
| **Marca** | thePower · BePharma · Edentia · Prometeo · Sanipro · Tecnio · Personalizada (con color propio) |
| Logo adicional | Co-marca opcional en el pie de página |
| Formato | PDF · Word (la portada, el índice y las fórmulas LaTeX son **solo PDF**) |
| Tipo de documento | **Compacto** («informe técnico denso: más texto por página») · **Cómodo** («más aire e interlineado, cuerpo mayor») |
| Portada | Sin portada / Con portada. Datos del frontmatter: `cover_title` (o el primer `#`), `cover_kicker`, `cover_subtitle`, `cover_date`, `cover_footer` |
| Índice | Sin índice · **Simple** (lista las secciones `##`) · **Detallado** (añade los apartados `###`), con números de página reales |
| Texto justificado | Sí/No |
| Partición de palabras | Guiones para un justificado más apretado (idioma del documento) |
| Diagramas Mermaid | Se renderizan (o salen como código) |
| Márgenes y tamaños | Margen izquierdo, derecho, superior e inferior; cuerpo; interlineado; títulos H1, H2 y H3 |
| **Colores y contraste** | 10 colores editables y una **tabla de contraste WCAG** del esquema activo (siete combinaciones texto/fondo con ratio y nivel AAA/AA/Falla) |
| Vista previa en vivo | Opcional; botón «Generar PDF» y descarga con nombre editable |

**Markdown que entiende** (documentado en `docs/features.md` del repositorio): frontmatter YAML (`titulo`, `modulo`, `leccion`, `eyebrow` y las claves `cover_*`) · títulos `#`–`####` · párrafos · negrita, cursiva y código en línea · listas (un nivel de anidado) · tablas · citas `>` · regla `---` · imágenes sueltas en su línea · bloques de código con lenguaje (con resaltado) · callout «Copy to Claude» · quiz `**N.** pregunta` + `a) b) c)` · fórmulas LaTeX (`$…$`, `$$…$$`; solo PDF) · diagramas Mermaid (PDF y Word).

Límites declarados: las imágenes remotas no se descargan (sin red en el navegador); las imágenes locales se resuelven contra el directorio del `.md`; un diagrama Mermaid con error se deja como código y avisa por consola.

### Lo que se comprobó en la herramienta en vivo (21-oct-2026)

| Prueba | Resultado |
|---|---|
| Generar un PDF con la marca Prometeo desde un `.md` con frontmatter, listas, tabla, código, cita, fórmula y Mermaid | **Genera el PDF** (114 KB, 4 páginas en la prueba) |
| Índice «Detallado» | Lista como secciones los **`##`** («1. Modelos de interfaz») y como apartados los **`###`** («Un widget con estado»); **no lista los `#`** |
| Panel de colores de Prometeo | Muestra «Subtítulos (h3) / página: ratio **2,40 → Falla**» (el naranja `#E6945A` sobre blanco), el mismo fallo que se calcula en [01](01_marcas_paletas_tipografias.md#13-contraste-y-legibilidad-wcag) |

## 10.2 El repositorio

- **Repositorio público:** `SupernovaIa/layout-studio` (rama `main`; permisos de la cuenta de GitHub conectada: **lectura**).
- **Arquitectura:** `apps/web` (Vite, React y Tailwind, estático, desplegado en Vercel) + `packages/renderer` (paquete Python que se empaqueta como *wheel* y corre en Pyodide). El motor usa **ReportLab** (las fuentes se registran como TTF).
- **Marcas:** ficheros estáticos en `apps/web/public/brands/<slug>/` con `brand.json`, `logo.png`, `icon.png` opcional y `fonts/{regular,bold,medium,light,italic}.ttf` (los cinco son obligatorios; `mono` opcional). El catálogo público del repositorio solo trae `mimarca` y `personalizada`; **las marcas de la empresa (thePower, Prometeo, Sanipro, etc.) no están en el repositorio público**, así que el catálogo desplegado sale de otra copia.
- **Para añadir o corregir una marca:** crear `brands/<slug>/` con los recursos, añadir el slug a `index.json`, commit y despliegue.

### Esquema de `brand.json` (`brand.schema.json`)

| Clave | Obligatoria | Descripción |
|---|---|---|
| `slug` | sí | kebab-case; igual que la carpeta |
| `name` | sí | Nombre visible |
| `font_family` | sí | Familia registrada en ReportLab |
| `colors` | sí | Objeto con: `primary_dark`, `primary_mid`, `primary_light` (**obligatorios**), y opcionales `text`, `text_soft`, `line`, `bg_soft`, `quote_bg`, `white`, `table_header_bg`, `header_rule`, `footer_rule`, `heading`, `page_number` (`#RRGGBB`; cualquier otra clave se rechaza) |
| `font_files` | sí | `regular`, `bold`, `medium`, `light`, `italic` (y `mono` opcional): rutas relativas a TTF |
| `logo_file`, `icon_file`, `logo_fallback_text`, `document_author` | no | Recursos y metadatos |
| `layout_defaults` | no | Sobrescritura parcial de las opciones de maquetación (`margin_*`, `body_size`, `body_lead`, `h1_size`, `h2_size`, `h3_size`, `justify`, `code_dark`, `code_style`, `editorial`…) |

## 10.3 Los colores de las marcas: herramienta frente a oficial

Valores leídos en la web desplegada (cada marca, 10 colores editables) frente a los oficiales (`paletas.json`). **Para Prometeo, Edentia y Sanipro no coinciden.**

| Marca | Color de marca | Oscuro | Medio | Claro | Caja suave | Cita | Texto | Líneas |
|---|---|---|---|---|---|---|---|---|
| **Prometeo** (herramienta) | `#E6945A` | `#152A1D` | `#E6945A` | `#B9BFBB` | `#FBEFE6` | `#FEFAF3` | `#1A1A1A` | `#D6DEE5` |
| Prometeo (oficial) | acento `#E6945A` | `#152A1D` | `#2C4436` | — | tarjeta `#F7F3EE` | cebra `#FBF8F5` | `#3D4A40` | `#F3E6DA` |
| **Edentia** (herramienta) | `#34667D` | `#152932` | `#34667D` | `#DCE7E1` | `#F1E8D9` | `#DCE7E1` | `#1A1A1A` | `#D6DEE5` |
| Edentia (oficial) | — | `#152932` | `#2C4954` | acento `#C7D8D1` | tarjeta `#EDF3F0` | cebra `#F6FAF8` | `#2C4954` | `#C7D8D1` |
| **Sanipro** (herramienta) | `#1F6FA8` | `#003D6B` | `#1F6FA8` | `#B7E0F5` | `#F4F7FA` | `#EAF4FB` | `#1A1A1A` | `#D6DEE5` |
| Sanipro (oficial) | — | `#245578` | `#336D93` | acento `#8BD2E5` | tarjeta `#EAF5F9` | cebra `#F4FAFC` | `#2C4A63` | `#CFE7EF` |
| thePower (herramienta) | `#3A6870` | `#1C3C42` | `#3A6870` | `#82C4AF` | `#ECF6F3` | `#ECF6F3` | `#1A1A1A` | `#D6DEE5` |
| BePharma (herramienta) | `#336699` | `#1B1464` | `#336699` | `#99CCFF` | `#F4F7FA` | `#EAF4FB` | `#1A1A1A` | `#D6DEE5` |
| Tecnio (herramienta) | `#217C78` | `#017AEB` | `#217C78` | `#B3D9FB` | `#F4F7FA` | `#EAF4FB` | `#1A1A1A` | `#D6DEE5` |

Observaciones:

1. En la herramienta, **«Medio» de Prometeo es el naranja de acento**, que se usa para los subtítulos H3 y por eso **falla el contraste (2,40)**. En las normas oficiales el naranja es **solo relleno o texto sobre fondo oscuro**, y el tono medio de la marca es `#2C4436`.
2. **Sanipro** en la herramienta usa la familia de azules `#1F6FA8/#003D6B/#B7E0F5`, que solo coincide en el oscuro `#003D6B` con la paleta de las hojas de ruta y **no** con las plantillas de presentación ni con `paletas.json` (`#245578/#336D93/#8BD2E5`).
3. **Edentia**: el «primario» `#34667D` no aparece en ninguna de nuestras paletas; el oscuro `#152932` sí coincide.
4. Las líneas son el gris genérico `#D6DEE5` en todas las marcas; las oficiales tienen su color de línea propio.
5. **thePower, BePharma y Tecnio** no tienen paleta oficial documentada en nuestros motores. La única referencia es la web (teal `#1E3740`, menta `#A1E6C5`, fondo `#F7F7F7`), que difiere de la de la herramienta.

### Valores de maquetación por defecto de la herramienta

| Preset | Margen izq. / der. / sup. / inf. | Cuerpo / interlineado | H1 / H2 / H3 |
|---|---|---|---|
| Compacto | 43 / 43 / 48 / 48 | 9,5 / 14,5 | 16,5 / 12,5 / 11 |
| Cómodo (y valores del renderizador) | 56 / 56 / 62 / 56 | 10,5 / 16,5 | 16,5 (22 en el código) / 12,5 (14) / 11 (11,5) |
| **Prometeo** (preset de marca) | 60 / 60 / 60 / 60 | 11 / 18 | 22 / 18 / 13 |

(Unidades: puntos tipográficos.)

## 10.4 Qué proponemos como entrada para la herramienta

### a) Marcas oficiales: `layout_studio/brands/{prometeo,edentia,sanipro}/brand.json`

Generadas a partir de `paletas.json`, con esta correspondencia de colores:

| Clave de Layout Studio | Origen en `paletas.json` |
|---|---|
| `primary_dark`, `table_header_bg`, `heading` | `dark` |
| `primary_mid`, `text_soft`, `page_number` | `mid` |
| `primary_light`, `header_rule` | `accent` |
| `text` | `body` |
| `line`, `footer_rule` | `line` |
| `quote_bg` | `card` |
| `bg_soft` | `zebra` |
| `white` | `#FFFFFF` |

**Regla de contraste:** el color `primary_light` (acento) **no puede usarse como color de texto sobre blanco** (ratios 2,40 / 1,48 / 1,69); en la herramienta debe limitarse a rellenos, reglas y números. Los títulos H3 deben usar `dark` o `mid`.

Tipografías: Poppins (`regular` → Regular, `bold` → SemiBold o Bold, `medium` → Medium, `light` → Light, `italic` → Italic) y `mono` → JetBrains Mono. **Hacen falta ficheros `.ttf`**: los que hay en la máquina son `.otf` (Poppins) y en `scripts/maquetar_pdf_unidad/plantilla/fuentes/` solo existen `.ttf` de Light, SemiBold, Bold y JetBrains Mono. Hay que obtener Regular, Medium e Italic en TTF.

Logos: `PLANTILLAS_FP/4_LOGOS_Y_PALETAS/{prometeo,edentia,sanipro}_logo.png` (verificar altura ≥ 400 px; la herramienta lo pide transparente).

`layout_defaults` propuesto para **documento de apoyo** (con `code_dark: true` y el estilo Ayu Mirage para el código, y la **marca de agua** del logo como opción) (igual que `plantilla_documento.py`): márgenes izquierdo/derecho 54, superior 82, inferior 60; cuerpo 10 pt con interlineado 16; H1 15, H2 11,5, H3 10; sin justificar. Para el **temario Prometeo por unidad** habría que usar el modo `editorial` o un preset aparte (véase 10.5).

### b) Un `.md` de prueba: `layout_studio/ejemplo/unidad_ejemplo_completo.md`

Una unidad completa con todos los elementos del corpus real (objetivos, introducción, secciones `#`/`##`, tabla, código con lenguaje, imagen con pie en `Imágenes/`, listas, cita, fórmula, Mermaid, mini proyecto, ejercicio y resumen). Sirve de **prueba de regresión** para comprobar las tres marcas.

## 10.5 Desajustes entre la herramienta y nuestras normas (hechos)

| # | Nuestra norma / corpus | Layout Studio hoy | Consecuencia |
|---|---|---|---|
| 1 | Un **`#` por sección** (`# 1. Apartado`) y `##` por subapartado; el `#` inicial es el título de la unidad | `#` = título del documento; **`##` = sección**; `###` = apartado; el índice lista `##`/`###` | Un `.md` de unidad del corpus produce un índice solo de subapartados y varios títulos «de documento». Hace falta **desplazar un nivel** (`#`→`##`, `##`→`###`) o un modo «temario» |
| 2 | **Caja especial** para «Objetivos de la unidad» e «Introducción» (etiquetas «RESULTADOS DE APRENDIZAJE» y «ACTIVACIÓN Y REFLEXIÓN»), borde izquierdo de acento | No existe: son títulos normales | Detectar por título o por etiqueta |
| 3 | Etiqueta **«SECCIÓN N»** sobre cada sección numerada, con el índice indicando el número de página real | Índice con número de página real, sin la etiqueta | Opcional por marca |
| 4 | **Cornisa lateral** «UT N · CÓDIGO», cabecera «≡», folio, marca «PROMETEO · by thePower» solo en portada | Cabecera y pie genéricos con logo | Pendiente de decidir qué pertenece al «modo temario» |
| 5 | Imágenes con pie en el texto alternativo y ruta `Imágenes/…` | Imágenes locales resueltas contra el directorio del `.md`; texto alternativo como nota si falla; **no consta que el alt sea el pie** | Confirmar el comportamiento del pie |
| 6 | Tablas: cabecera oscura con texto blanco, primera columna en negrita, cebra, **cabecera repetida** y **filas sin partir** | Por confirmar (el panel de contraste contempla «Cabecera de tabla») | Comprobar |
| 7 | **Código en estilo Ayu Mirage** (norma del 21-oct: fondo `#1F2430`, sintaxis coloreada) y **botón «Copiar»** en la salida web | Resaltado con Pygments; opción `code_dark` | Usar `code_dark: true` con el estilo Ayu Mirage (colores en [06 §6.3](06_markdown_texto_codigo_y_oro.md#63-bloques-de-código)) y añadir el componente con botón (`layout_studio/componentes/`) |
| 7b | **Marca de agua** del logo (150 mm, opacidad 5,5 %, centrada, detrás del texto) en todos los documentos, PDF y Word | **No consta** una marca de agua en las opciones de la herramienta | Añadirla como opción de marca (`watermark`) en PDF y DOCX |
| 7c | Todo documento descargable en **PDF y Word** | Formato PDF/Word disponible (portada, índice y fórmulas solo PDF) | Igualar las salidas Word (portada y marca de agua) |
| 8 | **Callouts por etiqueta** (`**Importante.**` en verde; `**Nota.**` en terracota; sin caja) | Cita `>` y «Copy to Claude»; sin etiqueta de color | Falta |
| 9 | Quiz canónico `**N. Enunciado**` + `a)` en párrafos aparte | Acepta `**N.** pregunta` + `- a)` (lista) | Aceptar ambos formatos |
| 10 | Enlaces en el texto (2 unidades) | Soportados en las versiones recientes (hipervínculos clicables) | Revisar en la versión desplegada |
| 11 | **Listas sueltas** (línea en blanco entre viñetas; 313 unidades) y cabeceras de tabla **en negrita** (758 unidades) | No tratadas | Normalizar al leer |
| 12 | Vallas con `#` en su interior (comentarios Bash) | Procesar las vallas **antes** que los encabezados | Comprobar |
| 13 | Marcadores `[CAPTURA/ESQUEMA/DIAGRAMA/TABLA…]` sin resolver → rojo `#C00000` negrita | Sin tratamiento específico | Avisar como error |
| 14 | Títulos **no huérfanos** (un título no debe quedar solo al final de una página) | A comprobar | En el motor oficial de temario sí ocurre |
| 15 | Contraste: el acento no se usa como color de texto sobre blanco | La paleta de Prometeo hace fallar el H3 | Cambiar el color del H3 |

## 10.6 Qué puede validar la herramienta automáticamente

Reglas que se pueden convertir en avisos antes de generar (todas salen de [08](08_catalogo_de_problemas.md) y [09](09_checklist_QA.md)):

**Del `.md`**

1. Primer encabezado `# Unidad N: …` y orden Objetivos → Introducción → secciones → cierres.
2. Imágenes: línea propia, ruta que existe, **texto alternativo descriptivo** (≥ 3 palabras; hace de pie).
3. Marcadores `[CAPTURA/ESQUEMA/DIAGRAMA/TABLA…]` sin resolver.
4. Vallas ``` sin lenguaje o sin cerrar.
5. Tablas: mismo número de celdas en todas las filas; cabecera sin negrita; sin celdas vacías.
6. Listas: máximo un nivel; formato uniforme; 3+ líneas en blanco seguidas.
7. `###` o `####` por encima del máximo del modo elegido.
8. Notas internas («Sustituye…», «prompt», «Clave pedagógica»).
9. Palabras con ortografía dudosa (diccionario es_ES) como aviso informativo.

**Del esquema de colores**

10. Contraste texto/fondo < 4,5 (texto normal) o < 3 (texto grande).
11. Color de acento usado como color de texto sobre fondo claro.
12. Colores fuera de la paleta de la marca (en importaciones).

**Del PDF**

13. Imágenes con proporción alterada > 6 % o < 96 ppi efectivos.
14. Título huérfano al final de página; tabla o código más alto que una página.
15. Fuentes no incrustadas o con peso «Thin».

## 10.7 Resumen para empezar

1. **Cargar las tres marcas oficiales** (`brands/*/brand.json`) y revisar el contraste del H3.
2. **Probar con `unidad_ejemplo_completo.md`** en las tres marcas y comparar con las figuras de [03](03_documentos.md).
3. **Decidir el mapeo de niveles** (`#` de sección → `##`) o añadir un modo «temario».
4. Añadir **callouts por etiqueta** y la **caja de objetivos/introducción**.
5. Activar las **validaciones** de 10.6 que más errores reales evitan: contraste, imágenes (ruta y alt), marcadores sin resolver y vallas sin lenguaje.
