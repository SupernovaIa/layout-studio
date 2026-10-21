# 01 · Marcas, paletas, tipografías y logos

> Qué marca usar para cada asignatura, qué colores y tipografías tiene cada una, cómo se usan los logos y qué errores de color/contraste hemos encontrado. Todo lo que sigue sale de los archivos oficiales (`PLANTILLAS_FP/4_LOGOS_Y_PALETAS/paletas.json`, las 3 plantillas `.pptx` oficiales y los motores de maquetación) y de los problemas reales de maquetación de octubre de 2026.

## 1.1 Qué marca corresponde a cada material

| Marca | Familia | Se usa para |
|---|---|---|
| **Prometeo** | Informática, marketing, administración y finanzas, intermodular… | Todo el material de ciclos de informática (DAM, DAW, ASIR, SMR) y de marketing/administración |
| **Sanipro** | Sanitaria | TCAE, TES, Farmacia y Parafarmacia, Laboratorio Clínico y Biomédico, Dietética… |
| **Edentia** | Dental | Higiene Bucodental, Prótesis Dentales |
| thePower · BePharma · Tecnio | Otras marcas de la herramienta Layout Studio | **No tienen paleta oficial en ninguno de nuestros motores de maquetación**; ver [10_layout_studio_para_Javier](10_layout_studio_para_Javier.md) |

Reglas:

1. **La marca la manda la asignatura**, no el profesor. Ejemplo conocido: Farmacia = Sanipro (azul). Si un profesor entrega un archivo con la marca equivocada (p. ej. una presentación de Farmacia con la plantilla de Edentia), se pasa a la marca correcta.
2. **Una sola marca por documento.** No se mezclan paletas dentro de un mismo archivo ni de una misma asignatura.
3. Todo el material de la plataforma (presentaciones, documentos de apoyo, hojas de ruta, componentes del Proyecto Intermodular) usa las **mismas paletas y Poppins**. La memoria que se pide al alumnado (Arial o Times 12, interlineado 1,5) es solo texto informativo y **no** es la tipografía de la plataforma.

## 1.2 Paletas oficiales

![Paletas de las tres marcas](img/paletas_marcas.png)

*Figura 1.1. Paletas de `paletas.json`. En Edentia, «Acento» y «Línea» comparten el mismo valor (`#C7D8D1`).*

| Token | Prometeo | Edentia | Sanipro | Uso |
|---|---|---|---|---|
| `dark` (oscuro) | `#152A1D` | `#152932` | `#245578` | Títulos, fondo de portada/cierre, cabecera de tabla |
| `mid` (medio) | `#2C4436` | `#2C4954` | `#336D93` | Subtítulos, etiquetas, pies |
| `body` (texto) | `#3D4A40` | `#2C4954` | `#2C4A63` | Cuerpo de texto en documentos |
| `card` (tarjeta) | `#F7F3EE` | `#EDF3F0` | `#EAF5F9` | Cuadros destacados y tarjetas |
| `line` (línea) | `#F3E6DA` | `#C7D8D1` | `#CFE7EF` | Bordes y separadores |
| `accent` (acento) | `#E6945A` | `#C7D8D1` | `#8BD2E5` | Viñetas, chips numéricos, regla del título |
| `zebra` (cebra) | `#FBF8F5` | `#F6FAF8` | `#F4FAFC` | Filas pares de tabla |

### Paleta completa de las plantillas de presentación (`.pptx`)

Extraída de los 3 `plantilla_*_oficial.pptx` (valores verificados contra los motores):

| Marca | Colores permitidos (hex, sin `#`) |
|---|---|
| Sanipro | `245578 336D93 5A7E90 6B8194 8A9BA8 8BD2E5 CFE7EF D8E9EF EAF5F9 F4FAFC FFFFFF` |
| Edentia | `152932 2C4954 4F6167 6E8187 7C8E93 C7D8D1 DCE7E1 EDF3F0 F1E8D9 F6FAF8 FFFFFF` |
| Prometeo | `E6945A FFFFFF 152A1D 6B7269 4A5449 F3E6DA FBF8F5 2C4436 F7F3EE 8C8377` |

Papel de cada color en las diapositivas (medido en las plantillas):

| Elemento | Prometeo | Edentia | Sanipro |
|---|---|---|---|
| Fondo de portada, sección y cierre | `152A1D` | `152932` | `245578` |
| Círculos decorativos de portada/cierre | blanco + `E6945A` | blanco + `DCE7E1` | blanco + `8BD2E5` |
| Texto de acento sobre fondo oscuro (ciclo, asignatura, fecha) | `E6945A` | `DCE7E1` | `8BD2E5` |
| Número grande de la sección | `2C4436` | _(véase [02](02_presentaciones.md))_ | _(véase [02](02_presentaciones.md))_ |
| Fondo de diapositiva de contenido | `FFFFFF` | `FFFFFF` | `FFFFFF` |
| Tarjeta de contenido | `FBF8F5` | `F6FAF8` | `F4FAFC` |
| Píldora del tipo de diapositiva (fondo) | `F7F3EE` | `EDF3F0` | `EAF5F9` |
| Título | `152A1D` | `152932` | `245578` |
| Etiqueta superior (kicker) | `4A5449` | `4F6167` | `6B8194` |
| Cuerpo (Poppins Light) | `6B7269` | `6E8187` | _hereda_ |
| Fondo de la diapositiva de actividad | `F7F3EE` | _(véase [02](02_presentaciones.md))_ | _(véase [02](02_presentaciones.md))_ |

### Discrepancias entre fuentes (decisión pendiente)

Los motores no usan exactamente los mismos valores. Para evitar incoherencias, **la referencia canónica es `paletas.json` + las plantillas `.pptx` oficiales**. Estas son las diferencias detectadas:

| Dónde | Marca | Qué dice | Diferencia con el canon |
|---|---|---|---|
| Hojas de ruta (`generar_hoja_ruta.py`) | Prometeo | fondo de página `#FAF0E7`, línea `#D08A4A`, texto `#1A2B1D` | Acento `#D08A4A` ≠ `#E6945A`; fondo de página en color (no blanco) |
| Hojas de ruta | Sanipro | fondo `#EAF7FB`, línea `#87E0F5`, texto `#003D6B` | Texto `#003D6B` ≠ `#245578`/`#2C4A63` |
| Hojas de ruta | Edentia | fondo `#F1E8D9`, línea `#DCE7E1`, texto `#152932` | Fondo crema (`#F1E8D9`) solo existe en la plantilla pptx, no en `paletas.json` |
| Componentes del Proyecto Intermodular | Edentia | etiqueta sobre oscuro `#F1E8D9` | `paletas.json` no tiene ese token |
| Motor de temario Prometeo (`renderizar_pdf_unidad.py`) | Prometeo | verde de tabla `#CBDECF`, crema `#FEFAF3`, `#F4EFE6` | Tokens propios del temario: no están en `paletas.json` |
| Skill `capturas-prometeo` | Prometeo | crema `#F3F0EA`, línea `#B9B9B4` | Distintos del crema del temario (`#FEFAF3`) |
| **Layout Studio** | Sanipro | primario `#1F6FA8`, oscuro `#003D6B`, claro `#B7E0F5` | **No coincide** con el Sanipro oficial (`#245578`, `#336D93`, `#8BD2E5`) |
| **Layout Studio** | Edentia | primario `#34667D`, oscuro `#152932`, caja suave `#F1E8D9` | Primario y caja suave distintos del canon |
| **Layout Studio** | Prometeo | medio `#E6945A`, claro `#B9BFBB`, caja suave `#FBEFE6`, cita `#FEFAF3` | Usa el naranja como «medio» y no tiene `#2C4436` |

Detalle de los valores de Layout Studio y recomendación de mapeo: [10_layout_studio_para_Javier](10_layout_studio_para_Javier.md).

## 1.3 Contraste y legibilidad (WCAG)

Ratios calculados con los valores oficiales (1 = invisible, 21 = negro sobre blanco; mínimo recomendado **4,5** para texto normal):

| Marca | Combinación | Ratio | Nivel |
|---|---|---|---|
| Prometeo | Cuerpo `#3D4A40` sobre blanco | 9,33 | AAA |
| Prometeo | Título `#152A1D` sobre blanco | 15,21 | AAA |
| Prometeo | Etiqueta `#2C4436` sobre blanco | 10,57 | AAA |
| Prometeo | **Acento `#E6945A` como texto sobre blanco** | **2,40** | **FALLA** |
| Prometeo | Acento `#E6945A` sobre oscuro `#152A1D` (ciclo de la portada) | 6,34 | AA |
| Edentia | **Acento `#C7D8D1` como texto sobre blanco** | **1,48** | **FALLA** |
| Edentia | Acento `#C7D8D1` sobre oscuro `#152932` | 10,16 | AAA |
| Sanipro | **Acento `#8BD2E5` como texto sobre blanco** | **1,69** | **FALLA** |
| Sanipro | Acento `#8BD2E5` sobre oscuro `#245578` | 4,71 | AA |
| Sanipro | Etiqueta `#336D93` sobre blanco | 5,60 | AA |

Otros valores medidos en las plantillas `.pptx`:

| Marca | Elemento | Ratio | Comentario |
|---|---|---|---|
| Prometeo | Cuerpo `#6B7269` sobre `#FBF8F5` | 4,69 | AA justo |
| Prometeo | Pie de foto `#8C8377` sobre `#F3E6DA` | 3,05 | Por debajo de 4,5 |
| Sanipro | Etiqueta superior `#6B8194` sobre blanco | 4,04 | Por debajo de 4,5 (texto de 10,5 pt) |
| Edentia | Cuerpo `#6E8187` sobre `#F6FAF8` | 3,87 | Por debajo de 4,5 |

**Reglas que se derivan:**

1. **El color de acento no se usa nunca como color de texto sobre fondo claro.** Solo como relleno (viñetas, chips, reglas, barras) o como texto sobre el fondo oscuro de la marca.
2. El texto de cuerpo sobre fondo claro usa `body` o `dark`; los grises más claros solo en pies y etiquetas de 10 pt o más.
3. Texto blanco solo sobre `dark` (cabeceras de tabla, portada, cierre).
4. Si una herramienta calcula el contraste, el criterio de fallo es **< 4,5** para texto normal y **< 3** para texto de 18 pt en adelante.

## 1.4 Tipografía

| Uso | Familia | Peso | Dónde |
|---|---|---|---|
| Diapositivas (todas las marcas) | **Poppins** | SemiBold (títulos), Medium (etiquetas), Regular (nombres), Light (cuerpo de plantilla) | Plantillas `.pptx` |
| Documentos de apoyo (`plantilla_documento.py`) | Poppins | 400 (cuerpo), 500 (etiquetas), 600 (títulos y negritas) | PDF A4 |
| Temario Prometeo por unidad (`renderizar_pdf_unidad.py`) | Poppins | 300 (cuerpo), 600 y 700 (títulos y negrita) | PDF A4; fuentes incrustadas (Light, SemiBold, Bold) |
| Código | JetBrains Mono (temario) · Menlo/Consolas/Courier New (documentos y diapositivas) | 400 | Bloques de código |
| Documentos «estilo oro» (Word) | **Arial** | 12 pt cuerpo | `.docx` Letter (véase [03](03_documentos.md)) |
| Memoria del alumnado (solo informativo) | Arial o Times New Roman | 12 pt, interlineado 1,5 | No es tipografía de plataforma |

**Error conocido: «Poppins Light» se exporta como «Poppins Thin».** Al convertir a PDF con LibreOffice (`soffice --headless`), el tipo «Poppins Light» de las plantillas sale como `Poppins-Thin`: el texto queda gris y casi ilegible. Se detectó en ~30 PDF.

- **Prevención:** antes de exportar, sustituir en el XML de cada diapositiva `Poppins Light` y `Poppins Thin` por `Poppins` (atributos `latin`, `ea`, `cs`, `sym` y `buFont`). Script: `scripts/plantilla_oro/fix_poppins_weights.py`.
- **Detección:** escanear el PDF con PyMuPDF; es un fallo si hay spans cuyo nombre de fuente contiene «Thin» con tamaño ≥ 9 pt, o si más del 45 % del texto está en Thin.

## 1.5 Logos

Archivos en `PLANTILLAS_FP/4_LOGOS_Y_PALETAS/`:

| Marca | PNG alta resolución | SVG |
|---|---|---|
| Prometeo | `prometeo_logo.png` | `PROMETEO_{POSITIVO,NEGATIVO,ISOTIPO}.svg` |
| Edentia | `edentia_logo.png` | `EDENTIA_{POSITIVO,NEGATIVO,ISOTIPO}.svg` |
| Sanipro | `sanipro_logo.png` | `SANIPRO_NEGATIVO.svg`, `SANIPRO_POSITIVO.png`, `SANIPRO_ISOTIPO.png` |

Reglas:

1. **Sobre fondo oscuro, logo `NEGATIVO` (blanco).** Sobre fondo claro, logo normal (`POSITIVO`).
2. **Sin deformar.** Si una plantilla trae un logo blanco estirado, se corrige con alto = ancho × (alto original / ancho original). Esto pasó: los logos blancos de la plantilla de Sanipro venían estirados un 20 %.
3. **Tamaño y posición del logo en diapositivas** (medidas de las plantillas, en puntos, esquina superior derecha):

| Marca | Portada, sección, actividad y cierre | Diapositivas de contenido |
|---|---|---|
| Prometeo | x 578,7 · y 21,6 · 101,7 × 23,6 | igual |
| Edentia | x 580,1 · y 21,6 · 100,3 × 23,6 | igual |
| Sanipro | x 588,2 · y 23,0 · 92,2 × 20,7 | x 602,0 · y 26,1 · 78,4 × 17,6 |

4. **No copiar el XML `<p:pic>` de un logo de una diapositiva a otra**: la relación `r:embed` no viaja y el logo sale roto o invisible. Hay que extraer la imagen y volver a insertarla con `add_picture`.
5. **Marca de agua en documentos:** el logo de la marca, grande y muy tenue, centrado en todas las páginas (150 mm de ancho; opacidad 0,055 en `plantilla_documento.py` y 0,06 en `docx_a_pdf_marca.py`). Cabecera: logo de 7,5 mm de alto a la izquierda (documento de apoyo) o 9 mm arriba a la derecha (anexos de profesor).
6. En el temario Prometeo por unidad **no hay logo de imagen**: la marca es el texto «PROMETEO · by thePower» solo en la portada.
7. Los logos de `_IDENTIDAD` (ISOTIPOS + LOGOTIPO) son la fuente original; los de `4_LOGOS_Y_PALETAS` son la copia ordenada.

## 1.6 Colores fuera de la marca (qué vigilar)

Los `.pptx` que entregan los profesores traen colores del tema de Google (acentos verdes, azules `#729FCF`, etc.) que LibreOffice dibuja fuera de marca. Lo que se vigila:

- **Verdes en Prometeo:** bordes de tabla, portadillas y cabeceras de tabla en verdes que no son los corporativos. Detector en el PDF renderizado: píxel con `g > 100` y `g > r + 25` y `g > b + 25`.
- **Tablas:** cabecera `dark`, primera columna en el tono medio de la marca y filas en crema/cebra de la marca (véase [05_tablas](05_tablas.md)).
- **Un profesor por marca:** no se mezclan colores de marca con los propios del profesor.
- Portada y cierre **editables** (texto real, no imagen), porque se editan los archivos después.

Ver el catálogo completo de problemas en [08_catalogo_de_problemas](08_catalogo_de_problemas.md).
