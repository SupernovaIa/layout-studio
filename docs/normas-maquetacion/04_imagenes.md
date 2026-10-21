# 04 · Imágenes, esquemas y capturas

> Cómo se colocan, se preparan y se dibujan las imágenes en presentaciones y documentos. Incluye la comprobación automática de calidad (proporción, resolución, transparencias), las reglas de los marcadores `[CAPTURA: …]` y de las skills que dibujan capturas y esquemas, y los fallos reales encontrados.

## 4.1 Reglas de oro de una imagen

1. **Completa, del tema y con fuente.** Una imagen explica lo que dice la diapositiva o el apartado; no está cortada; si no es propia, lleva la fuente indicada.
2. **Proporción original.** Jamás se estira ni se aplasta. Error si la proporción de la caja difiere más de un **6 %** de la de la imagen.
3. **Resolución suficiente.** Mínimo **96 ppi efectivos** (ppi = píxeles / ancho en pulgadas). Recomendación a profesores: imágenes de **≥ 1 000 px de ancho**.
4. **Sin cuadrados negros.** Las transparencias se aplanan sobre blanco antes de insertar (véase 4.3).
5. **Nitidez.** Se usa siempre el original; si es pobre, se reescala (4.4).
6. **Texto es texto.** El código, las tablas y los rótulos no van como captura de pantalla: se transcriben a elementos nativos.
7. **Sin texto encima de la imagen** salvo que sea del propio dibujo. Los pies de figura van **debajo** (documentos) o en el elemento de pie de la plantilla (diapositivas).

![Reglas de imagen: mal frente a bien](img/reglas_imagenes.png)

*Figura 4.1. Tres fallos clásicos (izquierda) y cómo deben verse (derecha): deformada, baja resolución y transparencia sobre fondo oscuro.*

## 4.2 Colocación

### En diapositivas

| Situación | Regla |
|---|---|
| Imagen suelta de contenido | Dentro de la tarjeta, escalada con `min(ancho_caja / ancho, alto_caja / alto)` y **centrada** |
| Galería | 3 marcos de **193 × 176,4 pt**, pie de foto debajo (Poppins Medium 12,5 pt) |
| Ejemplo visual | Panel de **327,6 × 405 pt** a sangre, a la izquierda; texto a la derecha desde x = 367,2 pt |
| Con texto del mismo bloque | **Junto a su texto**: no se separa en una galería aparte |
| Hueco ocupado | Se calcula su caja y se comprueba que **no solapa** ninguna otra forma. Si no hay hueco limpio, se marca para colocación manual |

Detalle completo en [02_presentaciones](02_presentaciones.md#26-imágenes-en-diapositivas).

### En documentos PDF

| Motor | Imagen | Pie | Límite |
|---|---|---|---|
| `plantilla_documento.py` | Centrada, `break-inside: avoid`, máx. **150 mm** de alto y 100 % de ancho (80 % con la clase `s`); solo por API: `("img", ruta, pie[, "s"])` | Poppins 400, 8 pt, color `mid`, debajo | No procesa `![…]` desde Markdown |
| `renderizar_pdf_unidad.py` | Figura al 100 % del ancho; esquinas 2 px; no se parte | 10 px cursiva `#666`; el pie sale del texto alternativo | **Solo carga rutas que empiecen por `Imágenes/`** |
| `docx_a_pdf_marca.py` | — | — | **Las imágenes del `.docx` no se pasan** |

### Al decidir con un `.md` de temario

- La ruta es `![Pie de figura](Imágenes/archivo.png)`; carpeta de imágenes con los nombres exactos.
- Si la imagen aún no existe, se deja un **marcador**: `[CAPTURA: …]`, `[ESQUEMA: …]`, `[DIAGRAMA: …]` o `[TABLA/GRÁFICO: …]` en un párrafo propio. Se pinta en **rojo `#C00000`, negrita** (el naranja `#C0532A` queda solo para notas editoriales del estilo oro).

## 4.3 Transparencias y fondos

- **Problema:** un PNG con transparencia se pinta con un cuadrado negro si el motor pierde la máscara alfa; en 13 presentaciones auditadas hubo cuadrados negros y páginas negras.
- **Prevención:** al preparar una imagen, `RGBA`/`LA`/`P` → PNG (conserva la transparencia) y el resto → **JPEG calidad 86**, **máx. 1 500 px**.
- **Comprobación:** renderizar y mirar. Una página negra solo es válida si es una fotografía o radiografía oscura.

## 4.4 Reescalado y calidad

| Caso | Qué se hace |
|---|---|
| Imagen del PDF/Word original disponible | Se usa el **original** (nunca una captura) |
| Foto pobre sin original | Reescalado 4× con **Magnific** (`ultra-sublime`, ~216 créditos por imagen, a veces bloquea alguna) |
| **Imagen con rótulos o etiquetas** | **NO** se usa Magnific: altera el texto («Pericardio» → «Perkardio»; etiquetas diminutas → pseudotexto). Se **borran los rótulos y se reescriben con texto nativo**, o se recorta la zona sin etiquetas |
| Profesor que no reenviará mejor calidad | Se conserva tal cual y se avisa |
| Imagen vectorial WMF/EMF que no abre | Se convierte con `soffice --convert-to png` antes de colocarla |
| Pptx de 16–24 MB que la plataforma no acepta | PNG > 60 KB → JPG al 84 %, máx. 1 600 px (si falla, 1 200 px); 19,6 → 4,6 MB en un caso real |

## 4.5 Qué se comprueba automáticamente

| Comprobación | Herramienta y umbral |
|---|---|
| Proporción | PyMuPDF `get_image_info`; **deformada > 6 %** |
| Resolución | ppi = px / ancho en pulgadas; **baja < 96 ppi** |
| Imágenes decorativas contadas como contenido (logo, banda) | Mismo `xref` en ≥ 25 % de las páginas (n ≥ 8) |
| Fotos que faltan tras reconstruir | `comprobar_fotos.py`: hash perceptual 8 × 8 sobre imágenes de ≥ 3 % de la página; contar y comparar (p. ej. 23/23) |
| Colores de las figuras | No se recolorean figuras ajenas sin pedirlo (se avisa) |

Estadística real: en 59 presentaciones auditadas, 15 tenían imágenes deformadas o de baja resolución (hasta un 47 % de deformación en un banner).

## 4.6 Casos reales: imagen que no explica el tema

![Imagen irrelevante y cortada](img/casos/a_rest.jpg)

*Figura 4.2. Un esquema de impresión recortado en una diapositiva sobre servicios REST.*

![Esquema propio y sencillo](img/casos/b_rest.jpg)

*Figura 4.3. El mismo hueco con un esquema propio (cliente, petición HTTPS, servidor, respuesta JSON), con formas nativas y texto real.*

## 4.7 Capturas y esquemas dibujados (skills `capturas-prometeo` y `capturas-sanipro`)

Cuando un temario tiene un marcador `[CAPTURA: …]`, `[ESQUEMA: …]` o `[DIAGRAMA: …]`, una skill lo convierte en un **PNG dibujado a 2×** con HTML y CSS (no es una captura real ni una foto).

| | `capturas-prometeo` | `capturas-sanipro` |
|---|---|---|
| Qué dibuja | Pantallas de aplicaciones informáticas: consola, Visor de eventos, explorador de archivos, navegador, editor de código o configuración, panel de métricas, analizador de tráfico, menú de arranque GRUB/UEFI, diálogos y asistentes, gestor de bases de datos, topología de red, rejillas de datos | Figuras sanitarias **planas**: recuadros de definición, grupos de constantes o conceptos (un color por ítem), mecanismos con flechas, silueta con puntos numerados, escalas de valores, tablas de datos |
| Lo que **no** hace | — | **No** redibuja ilustraciones anatómicas complejas (cortes de órganos, sistemas con etiquetas internas, vistas sagitales, fotos de dispositivos): se deja la imagen original del profesor |
| Paleta | `#152A1D` verde · `#E6945A` terracota · `#CBDECF` verde de tabla · crema `#F3F0EA` · línea `#B9B9B4` | `#245578` · `#336D93` · acento `#8BD2E5` (nunca como único color de texto) · tabla `#CFE7EF` · suave `#EAF5F9` |
| Ancho | 1 200 px (por defecto) | 1 000 px |

Reglas comunes (obligatorias):

1. **Nada inventado:** se dibuja solo lo que nombra el marcador o dice el material del profesor. Si falta un dato, se deja una **barra gris** (`.gris`).
2. **Que no parezca hecho con IA:** sin texto de relleno ilegible, sin palabras inventadas, **sin degradados, sin sombras, sin esquinas redondeadas y sin emojis**. El CSS lo fuerza (`border-radius: 0 !important; box-shadow: none !important`).
3. **El texto cabe y se lee:** ninguna etiqueta sale de su caja ni pisa otra.
4. **Iconos:** solo SVG de línea (`stroke-width: 1.5`, sin relleno), `#152A1D` (o blanco sobre oscuro). En topologías, rectángulos y texto: nada de iconos de banco de imágenes.
5. **Sin pie** en el PNG cuando el temario lo pone aparte (`--sin-pie`), para que no salga duplicado.
6. **Nombre del archivo:** `CÓDIGO-Uxx-TIPOnn.png` (p. ej. `0369-U04-CAP01.png`).
7. **Comprobación humana:** abrir el PNG y verificar que no hay texto fuera de caja, etiquetas pisadas, saltos de código perdidos ni demasiado hueco. El render falla automáticamente si el PNG pesa menos de 5 000 bytes o sale en blanco.

## 4.8 Esquemas y diagramas en las diapositivas

- Se hacen con **formas nativas** (cajas y flechas) y texto real, no con una imagen con rótulos.
- Una sola idea y un solo acento por rol: no cada esquema en un color distinto ni avisos en rojo.
- Texto dentro de las cajas, sin tocar los bordes; los números de paso en círculos de acento.
- Como regla de composición, que la forma exprese el orden (flechas, numeración), no solo el texto.

![Ejemplo bueno: flujo de callbacks](img/casos/g_callbacks.jpg)

*Figura 4.4. Buen ejemplo: orden en la propia forma (flechas), un color por fase y tarjetas con nombre y frase corta.*

![Ejemplo bueno: así no / así sí](img/casos/g_hilos.jpg)

*Figura 4.5. Buen ejemplo: una regla («no hagas tareas pesadas en el hilo de la interfaz») convertida en algo que se ve. Con la letra más grande (véase el [catálogo](08_catalogo_de_problemas.md)) sería perfecto.*
