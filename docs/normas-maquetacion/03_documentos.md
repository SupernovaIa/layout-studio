# 03 · Documentos (PDF A4 y Word)

> Normas de maquetación de documentos: apuntes, tablas resumen, actividades, rúbricas, anexos, hojas de ruta, temarios por unidad y componentes del Proyecto Intermodular. Cada tipo tiene su motor y su aspecto. Todos los valores son literales del código (archivo y línea en `_fuentes/01_motores_documentos.md`).

## 3.1 Qué tipo de documento usa qué motor

| Tipo de documento | Marcas | Motor | Entrada → salida | Página |
|---|---|---|---|---|
| **Documento de apoyo** (tablas resumen, actividades, rúbricas, guías, anexos) | Prometeo · Edentia · Sanipro | `PLANTILLAS_FP/2_DOCUMENTOS/plantilla_documento.py` | `.md` o bloques → PDF | A4 |
| **Anexo escrito por un profesor en Word** | Prometeo · Edentia · Sanipro | `scripts/plantilla_oro/docx_a_pdf_marca.py` | `.docx` → PDF | A4 |
| **Temario por unidad Prometeo** («PDF por unidad») | Solo Prometeo | `scripts/maquetar_pdf_unidad/renderizar_pdf_unidad.py` (**motor OFICIAL**) | `.md` + imágenes → PDF | A4 |
| **Hoja de ruta de asignatura** (mapa de unidades, no el temario) | Prometeo · Edentia · Sanipro | `scripts/hojas_de_ruta/generar_hoja_ruta.py` | datos → PDF | A4 con fondo de marca |
| **Componentes del Proyecto Intermodular** | Prometeo · Edentia · Sanipro | `scripts/proyecto_intermodular/componentes_definitivos.py` | datos → HTML en línea | Editor de la plataforma |
| **Temarios «estilo oro»** | Prometeo | `goldgen.py` (python-docx) | contenido → `.docx` | Carta (Letter) |
| **Documento en Word** (apoyo, anexo, guía) | Prometeo · Edentia · Sanipro | script de generación de las plantillas `.docx` (no incluido) | plantilla → `.docx` y PDF | A4 — véase [11](11_documentos_word.md) |
| Presentaciones | — | véase [02_presentaciones](02_presentaciones.md) | | |

Hechos que conviene tener presentes:

- Todos los motores PDF usan **WeasyPrint** (HTML + CSS de medios paginados). Todos son **A4**; **ninguno genera Word** y ninguno usa tamaño Carta (solo el estilo oro de los `.docx`).
- **Todo documento lleva marca de agua** (norma del 21-oct-2026): el logo grande y tenue, centrado y detrás del texto en todas las páginas, en PDF y en Word. Hoy **la tienen** el documento de apoyo y el anexo; **no la tienen** el temario por unidad ni la hoja de ruta (cambio pendiente).
- **El código va en estilo Ayu Mirage** (norma del 21-oct-2026, véase [06 §6.3](06_markdown_texto_codigo_y_oro.md#63-bloques-de-código)); los motores de PDF aún generan código claro (cambio pendiente).
- **Marcas con paleta en motores de documentos: Prometeo, Sanipro y Edentia.** thePower, BePharma y Tecnio no constan en ninguno.
- **La skill `maquetar-prometeo` no es el estándar**: es una propuesta de rediseño aparte. El motor oficial del temario Prometeo es `renderizar_pdf_unidad.py`.
- Una plantilla de **documento** no es una plantilla de **presentación**: ante «usa la plantilla» se confirma cuál. No se llama «anexo» a una presentación.
- Los **PDF originales de los profesores también se maquetan** (no se suben «tal cual»), sin perder su contenido.

## 3.2 Documento de apoyo A4 (`plantilla_documento.py`)

![Anatomía de un documento de apoyo](img/documentos/anatomia_documento_prometeo.png)

*Figura 3.1. Documento de apoyo de Prometeo (la geometría y los componentes son iguales en Edentia y Sanipro; cambian colores y logo).*

| Nº | Elemento | Especificación |
|---|---|---|
| 1 | Cabecera (se repite en todas las páginas) | Logo de la marca a la izquierda (**7,5 mm de alto**) y **etiqueta** a la derecha (Poppins 500, 7,5 pt, mayúsculas, `letter-spacing` 0,06 em, color `mid`). Línea inferior de **1,2 pt** en color de acento. Ancho 172 mm |
| 2 | Píldora de tipo de documento | Opcional. Poppins 500, 7,5 pt, mayúsculas, fondo `dark`, texto blanco, radio 10 mm |
| 3 | Título | Poppins **600, 25 pt**, interlineado 1,15, color `dark`, `text-wrap: balance` |
| 4 | Subtítulo y metadatos | Subtítulo 400, 12,5 pt, color `mid`; metadatos 400, 8,5 pt, color `mid` al 85 % |
| — | Regla decorativa | 42 mm × 3 pt, color de acento, esquinas redondeadas 2 pt |
| 5 | Apartado `h1` | 600, **15 pt**, color `dark`, margen superior 9 mm, línea inferior de 0,8 pt en color `line`. Si empieza por «N.» o «N.M.», el número va en un **chip** (fondo de acento, texto `dark`, mínimo 7 × 7 mm, radio 2,2 mm, 10 pt). Nunca queda al final de página sin texto detrás |
| 6 | Párrafo | Poppins **400, 10 pt, interlineado 1,6**, color `body`, **alineado a la izquierda**, margen inferior 2,8 mm, `orphans` y `widows` = 3 |
| 7 | Cuadro destacado (`> Etiqueta: texto`) | Fondo `card`, borde de 0,8 pt `line`, **borde izquierdo de 3 pt en `dark`**, radio 2 mm, relleno 3 × 4,5 mm. Etiqueta en 600, 7,5 pt, mayúsculas, color `mid`. No se parte entre páginas. Si la cita no tiene «Etiqueta:» de 2 a 30 caracteres, se titula «Importante» |
| 8 | Subapartado `h3` | 600, 10 pt, color `dark`, `letter-spacing` 0,02 em (el `h2` es 600 / 11,5 pt / `mid`) |
| 9 | Tabla | Véase [05_tablas](05_tablas.md) |
| 10 | Listas | Viñeta: círculo de 1,9 mm relleno de acento y borde de 0,9 pt en `mid`. Numerada: círculo de 4,2 mm con el número en 600, 7 pt. Sangría 5,5 mm; hasta un nivel de anidado |
| 11 | Pie | Izquierda: «{Marca} by thePower · {título corto, máx. 60 caracteres}». Derecha: «Página n de N». Poppins 400, 7,5 pt, color `mid` |

**Página:** A4 con márgenes **29 mm (arriba) · 19 mm (laterales) · 21 mm (abajo)**.

**Marca de agua:** el logo de la marca, a **150 mm de ancho**, centrado, con **opacidad 0,055** y detrás del contenido, repetido en todas las páginas.

**Portada:** no es una página aparte; el título, el subtítulo y los metadatos van en la primera página sobre el contenido.

**Markdown que entiende** (entrada `.md`): `# ` el primero es el título del documento; después `#` y `##` → apartado (h1) y `###` → h2; listas con `-`, `*` o `•` y numeradas `1.` / `1)`; tablas con `|`; `> Etiqueta: texto` → cuadro destacado; `---` → línea; `**negrita**`, `*cursiva*` y `` `código` `` en línea. **Limitaciones:** no procesa imágenes ni bloques de código ``` desde Markdown (solo por la API: `("img", ruta, pie)` y `("code", texto, lenguaje)`), `####` cae como párrafo y no hay índice.

Salto de página manual: bloque `("pagina",)`. Ejemplo de entrada: `PLANTILLAS_FP/2_DOCUMENTOS/ejemplo.md`; PDF de muestra por marca: `ejemplo_{prometeo,edentia,sanipro}.pdf`.

![Mismo documento en las tres marcas, página 1](img/documentos/ejemplo_3_marcas.png)

*Figura 3.2. El mismo contenido en Prometeo, Edentia y Sanipro.*

### Estructura recomendada de un documento de apoyo

1. **Título claro** + subtítulo (módulo, curso) + metadatos (profesor/a · fecha).
2. **Apartados numerados** (`## 1. …`) que no pasen de dos niveles (`### 1.1. …`).
3. **Un cuadro destacado** (`> Idea clave: …`) por cada definición o advertencia que no deba pasarse por alto; no más de uno por pantalla de contenido.
4. **Tablas** con cabecera; si son largas, la cabecera se repite en cada página y ninguna fila se parte.
5. **Todo dentro del recuadro**: el texto no se sale de celdas ni cuadros.

## 3.3 Anexo de profesor en Word → PDF (`docx_a_pdf_marca.py`)

Pasa un `.docx` a PDF de marca **sin tocar el texto**. Diferencias respecto al documento de apoyo:

| Aspecto | Valor |
|---|---|
| Página | A4, márgenes **30 / 20 / 24 / 20 mm** (arriba/lados/abajo) |
| Logo | Arriba a la **derecha**, 9 mm de alto; marca de agua al 6 % de opacidad, 150 mm, centrada |
| Pie | «{Marca} by thePower · {etiqueta}» a la izquierda y «Página n de N» a la derecha, 8 pt |
| Cuerpo | Poppins 400, **10,5 pt**, interlineado 1,6 |
| Título | 600, 24 pt; subtítulo 500, 13 pt; regla de 38 mm × 3 pt |
| `h1` | 600, 15 pt, con **barra izquierda de 3 pt en acento** |
| `h2` | 600, 12 pt, color `mid`; si es «DIAPOSITIVA N» o «Caso clínico N» va como **chip** oscuro con texto blanco |
| `h3` | 600, 11,5 pt, con el número en un círculo de 6,5 mm |
| Introducción | Primer párrafo de menos de 200 caracteres → caja `card` con borde izquierdo de 3 pt en `dark` |
| Tablas | 9 pt; cabecera `dark` con texto blanco; cebra; primera columna en 600; la tabla **sí puede partirse** entre páginas |

Heurísticas que aplica (sin cambiar el texto): une los párrafos partidos a mano; detecta título, `h1`/`h2` por estilo o por negrita corta; convierte viñetas escritas a mano (`•`, `·`, `▪`, `●`, `○`, `◦`, `-`, `–`, `—`) y párrafos numerados en listas; pone en negrita las etiquetas «Enfoque:», «Contenido sugerido:», «Tiempo de referencia:», «Objetivo:», etc.

**Limitaciones:** **las imágenes del `.docx` no se pasan**; no hay índice, ni bloques de código, ni cuadros por etiqueta.

## 3.4 Temario por unidad de Prometeo (`renderizar_pdf_unidad.py`)

Motor **oficial** de los temarios que ven profesorado y alumnado. El `.md` fuente **no se modifica**: es el formato de entrega en sí; el PDF se genera aparte, en una carpeta propia (nunca mezclado con los `.md`). Para lotes grandes se usa un script mecánico (sin LLM).

Uso:

```bash
python3 renderizar_pdf_unidad.py <unidad.md> <imagenes_dir> <codigo> <nombre_asignatura> <num_unidad> <destino.pdf> \
        [--foto-portada RUTA] [--sigla-ciclo SIGLA]
```

### Convención del `.md` de entrada

| En el `.md` | Resultado en el PDF |
|---|---|
| Primera línea `# Unidad N: Título` | Título de portada (no se repite en el cuerpo) |
| `# Objetivos de la unidad` | Caja con etiqueta **«RESULTADOS DE APRENDIZAJE»** |
| `# Introducción` | Caja con etiqueta **«ACTIVACIÓN Y REFLEXIÓN»** |
| `# 1. Título` (dígitos + punto + espacio) | Etiqueta **«SECCIÓN 1»** + H1; sus `##` pasan al índice como subentradas |
| Otro `# …` | H1 simple |
| `## …`, `### …` | h2 y h3 (el h3 **no** sale en el índice) |
| `![Pie de figura](Imágenes/archivo.png)` | Figura con pie (el texto alternativo es el pie) |
| `[CAPTURA: …]`, `[ESQUEMA: …]`, `[DIAGRAMA: …]`, `[TABLA/GRÁFICO: …]` en un párrafo propio | Marcador en **rojo `#C00000`, negrita** (señal de «imagen pendiente») |

> **Atención con las rutas de imagen.** El motor solo reescribe a ruta absoluta las imágenes cuya ruta empieza por **`Imágenes/`**. Con cualquier otra ruta (`imgs/…`, `./fig/…`) la imagen **no se carga**: sale solo el texto alternativo, duplicado como párrafo y pie. Comprobado con una prueba real.

### Anatomía

**Portada** (página a sangre, sin folio ni cornisa):

![Portada del temario](img/documentos/anatomia_rpu_portada.png)

*Figura 3.3. Portada sin foto: fondo verde `#152A1D`, marca, kicker en terracota y título.*

| Nº | Elemento | Especificación |
|---|---|---|
| 1 | Marca | «PROMETEO · by thePower», 11 px, peso 600, `letter-spacing` 3 px, opacidad 0,8; margen inferior 5,5 cm |
| 2 | Kicker | 11 px, peso 600, `letter-spacing` 3 px, **terracota `#E6945A`**, mayúsculas. Con `--sigla-ciclo`: «{asignatura} · {sigla}» (sin línea de ruta en el cuerpo); sin sigla: «{código} · {asignatura}» (con línea de ruta en cursiva en el cuerpo) |
| 3 | Título | 30 px, peso 700, interlineado 1,18, blanco, ancho máx. 15 cm. Con foto de portada: 28 px, foto de 18,5 cm de alto con `object-fit: cover`, marca superpuesta con sombra de texto; **la foto se usa solo en portada** y se retira del cuerpo si estaba en él |

**Índice** (página propia):

![Índice del temario](img/documentos/anatomia_rpu_indice.png)

*Figura 3.4. Índice con número de página real (`target-counter`).*

El índice incluye los títulos de las cajas (Objetivos, Introducción), las secciones «N.» y sus `##`, y los demás `#`. **No incluye `###`.** Entradas a 12,5 px; subentradas a 11,5 px, color `#555` y 16 px de sangría; relleno punteado `1px dotted #B9B9B9`.

**Cuerpo:**

![Página de cuerpo del temario](img/documentos/anatomia_rpu_cuerpo.png)

*Figura 3.5. Página de cuerpo (cajas, secciones, tabla, código y cita).*

| Nº | Elemento | Especificación |
|---|---|---|
| 1, 2 | Cajas «Objetivos» e «Introducción» | Fondo crema `#FEFAF3`, **borde izquierdo de 4 px en terracota**, relleno 16 × 20 px, no se parten entre páginas. Etiqueta terracota 10 px, 600, `letter-spacing` 2 px. Es el **único «callout»** del motor |
| 3 | Etiqueta de sección + H1 | «SECCIÓN N» terracota 10 px / 600 / `letter-spacing` 2 px; H1 **19 px**, peso 600, verde `#152A1D`, interlineado 1,28 |
| 4 | Párrafo | Poppins **300 (Light), 11,5 px, interlineado 1,62**, **justificado**, margen inferior 10 px; negrita en peso 700 y color verde |
| 5 | `h2` / `h3` | 14,5 px (margen superior 20 px) / 12,5 px en peso 700 (margen superior 16 px) |
| 6 | Tabla | 10,5 px; cabecera `#CBDECF` centrada en 600; bordes `1px solid #152A1D`; relleno 6 × 8 px; **no se parte entre páginas** |
| 7 | Código | **Hoy:** fondo `#F5F5F5`, borde `#D0D0D0`, borde izquierdo de 3 px en `#888`, JetBrains Mono 9,5 px, color `#000`; claro y sin resaltado. **Norma nueva: Ayu Mirage** (fondo `#1F2430`, sintaxis coloreada); cambio pendiente en el motor |
| 8 | Cita | Borde izquierdo de 3 px en terracota, color `#444` |
| 9 | Cabecera | Solo un «≡» gris `#CFCFCF` (14 px) arriba a la derecha |
| 10 | Cornisa | «UT N · CÓDIGO» en vertical en el margen derecho (9 px, `letter-spacing` 2 px, verde). Aparece en todas las páginas salvo portada e índice |
| 11 | Folio | Abajo a la derecha, Poppins 10 px, verde; numeración continua (la portada cuenta pero no la muestra) |

**Página:** A4 con márgenes **2,2 cm (arriba) · 3,1 cm (derecha) · 2,2 cm (abajo) · 2 cm (izquierda)**; el margen derecho es ancho porque aloja la cornisa. Tipografía Poppins 300/600/700 incrustada desde `plantilla/fuentes/` (no hay Regular 400 ni Medium 500: cualquier otro peso cae al más cercano).

**Imágenes:** figura al **100 % del ancho** (esquinas 2 px, no se parte entre páginas); pie en 10 px cursiva `#666`.

**Saltos:** portada, índice y cuerpo empiezan en página nueva. Cajas, figuras, tablas y bloques de código no se parten.

### Lo que este motor **no** hace (límites a conocer)

- **No evita títulos huérfanos**: una etiqueta «SECCIÓN 2» puede quedar al final de una página con su título en la siguiente (visible en la figura 3.5).
- Una tabla o un bloque de código **más alto que una página no se puede partir**.
- **No hay cierre ni contraportada, logo de imagen, test ni cuadros por etiqueta** (Importante, Nota…). **Tampoco hay marca de agua, que la norma exige** (pendiente).
- **Una sola marca**: Prometeo. No tiene parámetro de marca.
- El código no lleva colores de sintaxis y es claro: la norma pide ahora **Ayu Mirage** (pendiente).

## 3.5 Hoja de ruta de asignatura (`generar_hoja_ruta.py`)

Es un **mapa** de la asignatura (unidades, temas y objetivos), no el temario. Un PDF corto por asignatura.

| Aspecto | Valor |
|---|---|
| Página | A4, márgenes 2,3 / 2,2 / 2,3 / 2,2 cm, y **fondo de toda la página en color de marca** (no blanco) |
| Tipografía | Poppins (cuerpo 12,5 px, interlineado 1,6; se carga de Google Fonts: necesita red o Poppins instalada) |
| Primera página | Sin portada aparte: fila con el ciclo (izquierda, 11 px / 600) y el logo (derecha, 30 px de alto); `h1` con la asignatura (29 px / 700); kicker «Conoce los objetivos de la asignatura»; regla de 2 px |
| Cada unidad | Empieza en página nueva. `h2` «UNIDAD N: TÍTULO EN MAYÚSCULAS» (15 px / 700), «Resumen general de la unidad», «Temas y objetivos» (por tema: `h4`, párrafo y lista «Objetivos:» con sublista) |
| Cierre | Tabla «Unidad · Título · Temas principales» en página nueva (bordes de 1 px, sin fondo en la cabecera) |
| Paleta de página | Prometeo `#FAF0E7` (línea `#D08A4A`, texto `#1A2B1D`) · Sanipro `#EAF7FB` (`#87E0F5`, `#003D6B`) · Edentia `#F1E8D9` (`#DCE7E1`, `#152932`) |

Ojo: esta paleta **no coincide** con `paletas.json` (véase [01](01_marcas_paletas_tipografias.md#discrepancias-entre-fuentes-decisión-pendiente)).

## 3.6 Componentes del Proyecto Intermodular (HTML para el editor)

No son PDF: cada componente es un bloque HTML con estilos en línea para pegar en el editor de la plataforma. Tipografía Poppins. Tarjetas con **esquinas redondeadas** (8–18 px), a diferencia de las skills de capturas (esquinas rectas): son sistemas distintos.

Los 11 componentes: portada de sección · tarjetas de texto · tarjetas con idea clave · entrega con fecha (y progreso) · hoja de ruta (con progreso) · contacto de tutores · ficha de tutor · tabla de criterios · recurso con enlace · formato de la memoria del alumno · bloque de impacto suelto.

| Pieza | Estilo literal |
|---|---|
| Contenedor | `border-radius: 18px; border: 1px solid {linea}; background: {suave}; font-size: 15px; line-height: 1.6`; cabecera interna en el color oscuro con eyebrow (11 px, 600, `letter-spacing` 0,14 em, mayúsculas) y título de 26 px |
| Tarjeta | Fondo blanco, borde `{linea}`, `border-radius: 14px; padding: 16px 18px`; ancho por defecto `calc(50% - 7px)` |
| Cuadrito numerado | 24 × 24 px, radio 8 px, fondo `card`, 700, 12 px |
| Barra de progreso | Segmentos de 10 px de alto, radio 6 px, relleno de acento o gris `#E3E3E3`; **solo en la hoja de ruta** (decisión del 8-oct) |
| Bloque de impacto | Fondo oscuro, radio 16 px, texto blanco; etiqueta 11 px / 700; texto 22 px / 700; número grande opcional de 64 px en acento |
| Tabla de criterios | 14 px; cabecera oscura con texto blanco; filas con borde inferior `{linea}` |

La memoria que se le pide al alumnado (Arial o Times 12, interlineado 1,5) aparece solo como texto informativo en el componente 10: **no** es tipografía de la plataforma.

Diseño elegido: opción B (tarjetas) «pura», sin barras de progreso salvo en la hoja de ruta; la opción C (oscuro de impacto) solo para lo puntual (idea clave, fecha, avisos).
