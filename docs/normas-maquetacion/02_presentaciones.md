# 02 · Presentaciones (`.pptx` y PDF de diapositivas)

> Todo lo que hay que respetar al maquetar una presentación de Prometeo, Edentia o Sanipro: formato, tipos de diapositiva con sus medidas exactas, tamaños de letra, portada, imágenes, tablas, código, cierre y control de calidad. Las medidas están leídas de las plantillas oficiales (`PLANTILLAS_FP/1_PPT_plantillas_oficiales/`); las reglas, de las 83 incidencias reales catalogadas en [08_catalogo_de_problemas](08_catalogo_de_problemas.md).

## 2.1 Formato

| Dato | Valor |
|---|---|
| Proporción | 16:9 |
| Tamaño del lienzo | **720 × 405 pt** (25,4 × 14,29 cm; 9 144 000 × 5 143 500 EMU; 1 pt = 12 700 EMU) |
| Tipografía | Poppins (véase [01](01_marcas_paletas_tipografias.md)) |
| Margen izquierdo de los contenidos | 39,6 pt |
| Margen derecho | 39,6 pt (los contenidos terminan en x = 680,4) |
| Zona útil hacia abajo | Hasta ≈ 0,93 del alto (y ≈ 376 pt); la tarjeta de contenido acaba en y = 363,6 |
| Archivos de entrada atípicos | 960 × 540 pt (33,9 cm) o 4:3. **Para comparar tamaños de letra con la plantilla hay que multiplicar por 0,75** |

Las tres plantillas son idénticas en geometría; cambian los **colores** y el **tamaño del logo** (véase [01](01_marcas_paletas_tipografias.md#15-logos)). Plantilla de partida: **nunca se edita el original oficial**, se trabaja siempre sobre una copia.

## 2.2 Tipos de diapositiva y orden en cada plantilla

Son 8 tipos. El **orden no es el mismo** en las tres plantillas (esto importa para cualquier herramienta que use la plantilla por índice):

| Tipo | Prometeo | Edentia | Sanipro |
|---|---|---|---|
| Portada | 0 | 0 | 0 |
| Sección | 1 | 1 | 1 |
| Concepto | 2 | 2 | 2 |
| Ejemplo | 3 | 3 | 3 |
| Actividad | 4 | 4 | 4 |
| Galería visual | **5** | 6 | 7 |
| Ejemplo visual | **6** | 5 | 5 |
| Ejemplo visual (2.ª variante) | — | — | 6 |
| Cierre («¿Preguntas?») | 7 | 7 | **8** |
| Total | 8 | 8 | 9 |

La 2.ª variante de «Ejemplo visual» de Sanipro: panel de imagen estrecho a la izquierda (197,6 × 405 pt) y una tarjeta de texto grande (459,6 × 314 pt) para un caso descrito en prosa, en lugar de 3 puntos.

En el motor `plantilla_oro` el cierre es `PRE=8` en Sanipro y `PRE=7` en Edentia y Prometeo; los identificadores internos «Google Shape;N» están desplazados una unidad en Edentia/Prometeo (`off=1`).

## 2.3 Anatomía y medidas de cada tipo (Prometeo; Edentia y Sanipro cambian colores y logo)

Cada tabla da, para cada elemento numerado en la figura, su posición, tamaño, tipografía y color en las tres marcas. «Texto X» es el color de la letra; «fondo X» el relleno de la forma.

### 2.3.1 Portada

Primera diapositiva de **cada** presentación. Un archivo = una unidad (o tema/sesión). Siempre editable (texto nativo).

![Anatomía de la diapositiva Portada](img/anatomia/prometeo_01_portada.png)

*Figura 2.1. Anatomía (geometría idéntica en las tres marcas; cambian colores y logo). Contornos y números solo sobre el borde de la diapositiva: no tapan texto.*

| Nº | Elemento | x · y (pt) | Ancho × alto (pt) | Tipografía | Prometeo | Edentia | Sanipro |
|---|---|---|---|---|---|---|---|
| 1 | Línea superior: ciclo formativo | 39.6 · 44.6 | 432 × 25.2 | Poppins Medium 12 pt | texto E6945A | texto DCE7E1 | texto 8BD2E5 |
| 2 | Título de la unidad | 39.6 · 133.2 | 576 × 122.4 | Poppins Light 38 pt | texto FFFFFF | texto FFFFFF | texto FFFFFF |
| 3 | Asignatura · curso · duración | 39.6 · 260.6 | 540 × 32.4 | Poppins 15 pt | texto E6945A | texto DCE7E1 | texto 8BD2E5 |
| 4 | Línea de acento | 39.6 · 327.6 | 144 × 0 | — | — | — | — |
| 5 | Nombre del profesor/a | 39.6 · 337 | 324 × 23 | Poppins 12 pt | texto FFFFFF | texto FFFFFF | texto FFFFFF |
| 6 | Fecha dd / mm / aaaa | 39.6 · 358.6 | 324 × 21.6 | Poppins Light 11 pt | texto E6945A | texto DCE7E1 | texto 8BD2E5 |
| 7 | Logo de la marca | 578.7 · 21.6 | 101.7 × 23.6 | — | — | — | — |

### 2.3.2 Sección (portadilla)

Portadilla para separar bloques grandes. Numeración correlativa 01, 02, 03… y «SECCIÓN N». Si la presentación es corta puede no llevar secciones.

![Anatomía de la diapositiva Sección (portadilla)](img/anatomia/prometeo_02_seccion.png)

*Figura 2.2. Anatomía (geometría idéntica en las tres marcas; cambian colores y logo). Contornos y números solo sobre el borde de la diapositiva: no tapan texto.*

| Nº | Elemento | x · y (pt) | Ancho × alto (pt) | Tipografía | Prometeo | Edentia | Sanipro |
|---|---|---|---|---|---|---|---|
| 1 | Etiqueta «SECCIÓN N» | 39.6 · 154.8 | 360 × 25.2 | Poppins Medium 13 pt | texto E6945A | texto DCE7E1 | texto 8BD2E5 |
| 2 | Número grande (decorativo) | 367.2 · 39.6 | 313.2 × 331.2 | Poppins SemiBold 220 pt negrita | texto 2C4436 | texto 2C4954 | texto 336D93 |
| 3 | Título de la sección | 39.6 · 180 | 403.2 × 115.2 | Poppins SemiBold 30 pt negrita | texto FFFFFF | texto FFFFFF | texto FFFFFF |
| 4 | Logo de la marca | 578.7 · 21.6 | 101.7 × 23.6 | — | — | — | — |

### 2.3.3 Concepto

Diapositiva de explicación: una idea, definición o lista. Es la que más se usa. Si el texto no cabe a 12–14 pt, se parte en dos (con «(1/2)» y «(2/2)» en el título).

![Anatomía de la diapositiva Concepto](img/anatomia/prometeo_03_concepto.png)

*Figura 2.3. Anatomía (geometría idéntica en las tres marcas; cambian colores y logo). Contornos y números solo sobre el borde de la diapositiva: no tapan texto.*

| Nº | Elemento | x · y (pt) | Ancho × alto (pt) | Tipografía | Prometeo | Edentia | Sanipro |
|---|---|---|---|---|---|---|---|
| 1 | Etiqueta superior (kicker) | 39.6 · 27.4 | 396 × 21.6 | Poppins Medium 10.5 pt | texto 4A5449 | texto 4F6167 | texto 6B8194 |
| 2 | Píldora del tipo de diapositiva | 568.8 · 46.8 | 111.6 × 28.8 | — | fondo F7F3EE | fondo EDF3F0 | fondo EAF5F9 |
| 3 | Título | 39.6 · 44.6 | 453.6 × 43.2 | Poppins SemiBold 25 pt negrita | texto 152A1D | texto 152932 | texto 245578 |
| 4 | Tarjeta de contenido | 39.6 · 108 | 640.8 × 255.6 | — | fondo FBF8F5 | fondo F6FAF8 | fondo F4FAFC |
| 5 | Cuerpo de texto | 64.8 · 126 | 590.4 × 223.2 | Poppins Light 14.5 pt | texto 6B7269 | texto 6E8187 | — |
| 6 | Logo de la marca | 578.7 · 21.6 | 101.7 × 23.6 | — | — | — | — |

### 2.3.4 Ejemplo / caso práctico

Caso práctico o aplicación de lo explicado antes. Misma tarjeta que «Concepto» con la píldora «EJEMPLO» y un icono circular.

![Anatomía de la diapositiva Ejemplo / caso práctico](img/anatomia/prometeo_04_ejemplo.png)

*Figura 2.4. Anatomía (geometría idéntica en las tres marcas; cambian colores y logo). Contornos y números solo sobre el borde de la diapositiva: no tapan texto.*

| Nº | Elemento | x · y (pt) | Ancho × alto (pt) | Tipografía | Prometeo | Edentia | Sanipro |
|---|---|---|---|---|---|---|---|
| 1 | Etiqueta superior (kicker) | 39.6 · 27.4 | 396 × 21.6 | Poppins Medium 10.5 pt | texto 4A5449 | texto 4F6167 | texto 6B8194 |
| 2 | Píldora «EJEMPLO» | 39.6 · 46.8 | 93.6 × 28.8 | — | fondo E6945A | fondo F1E8D9 | fondo 8BD2E5 |
| 3 | Título | 39.6 · 86.4 | 612 × 39.6 | Poppins SemiBold 22 pt negrita | texto 152A1D | texto 152932 | texto 245578 |
| 4 | Icono circular | 619.2 · 86.4 | 50.4 × 50.4 | — | fondo E6945A | fondo F1E8D9 | fondo 8BD2E5 |
| 5 | Tarjeta de contenido | 39.6 · 154.8 | 640.8 × 208.8 | — | fondo FBF8F5 | fondo F6FAF8 | fondo F4FAFC |
| 6 | Cuerpo de texto | 64.8 · 174.2 | 590.4 × 172.8 | Poppins Light 14 pt | texto 6B7269 | texto 6E8187 | — |
| 7 | Logo de la marca | 578.7 · 21.6 | 101.7 × 23.6 | — | — | — | — |

### 2.3.5 Actividad

Ejercicio con pasos numerados (hasta 3 por diapositiva en la plantilla) y chip de duración. Se rellena **todo** («__ minutos» no puede quedar sin rellenar).

![Anatomía de la diapositiva Actividad](img/anatomia/prometeo_05_actividad.png)

*Figura 2.5. Anatomía (geometría idéntica en las tres marcas; cambian colores y logo). Contornos y números solo sobre el borde de la diapositiva: no tapan texto.*

| Nº | Elemento | x · y (pt) | Ancho × alto (pt) | Tipografía | Prometeo | Edentia | Sanipro |
|---|---|---|---|---|---|---|---|
| 1 | Etiqueta superior (kicker) | 39.6 · 27.4 | 396 × 21.6 | Poppins Medium 10.5 pt | texto 4A5449 | texto 4F6167 | texto 6B8194 |
| 2 | Icono de actividad | 39.6 · 46.8 | 44.6 × 44.6 | — | fondo E6945A | fondo F1E8D9 | fondo 8BD2E5 |
| 3 | Título de la actividad | 97.2 · 46.8 | 446.4 × 44.6 | Poppins SemiBold 21 pt negrita | texto 152A1D | texto 152932 | texto 245578 |
| 4 | Chip de duración | 554.4 · 52.6 | 126 × 30.2 | — | fondo FFFFFF | fondo FFFFFF | fondo FFFFFF |
| 5 | Tarjeta blanca de pasos | 39.6 · 111.6 | 640.8 × 252 | — | fondo FFFFFF | fondo FFFFFF | fondo FFFFFF |
| 6 | Número del paso | 64.8 · 136.8 | 25.9 × 25.9 | — | fondo E6945A | fondo F1E8D9 | fondo 8BD2E5 |
| 7 | Texto del paso | 103 · 133.2 | 547.2 × 36 | Poppins Light 13 pt | texto 6B7269 | texto 6E8187 | texto 8A9BA8 |
| 8 | Logo de la marca | 578.7 · 21.6 | 101.7 × 23.6 | — | — | — | — |

### 2.3.6 Ejemplo visual (foto a sangre)

Una fotografía a sangre a la izquierda y hasta 3 puntos de «qué observar» a la derecha. Sanipro tiene dos variantes (véase 2.2).

![Anatomía de la diapositiva Ejemplo visual (foto a sangre)](img/anatomia/prometeo_07_ejemplo_visual.png)

*Figura 2.6. Anatomía (geometría idéntica en las tres marcas; cambian colores y logo). Contornos y números solo sobre el borde de la diapositiva: no tapan texto.*

| Nº | Elemento | x · y (pt) | Ancho × alto (pt) | Tipografía | Prometeo | Edentia | Sanipro |
|---|---|---|---|---|---|---|---|
| 1 | Panel de imagen a sangre (izquierda) | 0 · 0 | 327.6 × 405 | — | fondo F3E6DA | fondo DCE7E1 | fondo CFE7EF |
| 2 | Etiqueta superior (kicker) | 367.2 · 39.6 | 313.2 × 21.6 | Poppins Medium 10.5 pt | texto 4A5449 | texto 4F6167 | texto 6B8194 |
| 3 | Título | 367.2 · 63.4 | 313.2 × 50.4 | Poppins SemiBold 22 pt negrita | texto 152A1D | texto 152932 | texto 245578 |
| 4 | Viñeta circular | 367.2 · 140.4 | 24.5 × 24.5 | — | fondo E6945A | fondo F1E8D9 | fondo 8BD2E5 |
| 5 | Texto del punto | 403.2 · 136.8 | 277.2 × 54 | Poppins Light 12.5 pt | texto 6B7269 | texto 6E8187 | texto 8A9BA8 |
| 6 | Logo de la marca | 578.7 · 21.6 | 101.7 × 23.6 | — | — | — | — |

### 2.3.7 Galería visual

Hasta 3 imágenes en fila con pie de foto. Cada imagen en su marco, sin deformar. No se usa para «guardar» imágenes sueltas lejos de su texto.

![Anatomía de la diapositiva Galería visual](img/anatomia/prometeo_06_galeria.png)

*Figura 2.7. Anatomía (geometría idéntica en las tres marcas; cambian colores y logo). Contornos y números solo sobre el borde de la diapositiva: no tapan texto.*

| Nº | Elemento | x · y (pt) | Ancho × alto (pt) | Tipografía | Prometeo | Edentia | Sanipro |
|---|---|---|---|---|---|---|---|
| 1 | Etiqueta superior (kicker) | 39.6 · 27.4 | 396 × 21.6 | Poppins Medium 10.5 pt | texto 4A5449 | texto 4F6167 | texto 6B8194 |
| 2 | Título | 39.6 · 44.6 | 612 × 43.2 | Poppins SemiBold 25 pt negrita | texto 152A1D | texto 152932 | texto 245578 |
| 3 | Marco de imagen (×3) | 39.6 · 118.8 | 193 × 176.4 | — | fondo F3E6DA | fondo DCE7E1 | fondo CFE7EF |
| 4 | Pie de foto | 39.6 · 306 | 193 × 28.8 | Poppins Medium 12.5 pt | texto 152A1D | texto 152932 | fondo CFE7EF |
| 5 | Logo de la marca | 578.7 · 21.6 | 101.7 × 23.6 | — | — | — | texto 5A7E90 |

### 2.3.8 Cierre

Última diapositiva: «¿Preguntas?» con el número de página. No se añade «Gracias», ni «Cierre de la unidad», ni un logo suelto.

![Anatomía de la diapositiva Cierre](img/anatomia/prometeo_08_cierre.png)

*Figura 2.8. Anatomía (geometría idéntica en las tres marcas; cambian colores y logo). Contornos y números solo sobre el borde de la diapositiva: no tapan texto.*

| Nº | Elemento | x · y (pt) | Ancho × alto (pt) | Tipografía | Prometeo | Edentia | Sanipro |
|---|---|---|---|---|---|---|---|
| 1 | Icono | 329.8 · 82.8 | 60.5 × 60.5 | — | fondo E6945A | fondo F1E8D9 | fondo 8BD2E5 |
| 2 | Título «¿Preguntas?» | 0 · 162 | 720 × 61.2 | Poppins SemiBold 40 pt negrita | texto FFFFFF | texto FFFFFF | texto FFFFFF |
| 3 | Texto de cierre | 108 · 226.8 | 504 × 36 | Poppins Light 15 pt | texto E6945A | texto DCE7E1 | texto 8BD2E5 |
| 4 | Número de diapositiva | 637.2 · 374.8 | 43.2 × 21.6 | Poppins Light 10 pt | texto E6945A | — | — |
| 5 | Logo de la marca | 578.7 · 21.6 | 101.7 × 23.6 | — | — | — | — |

### Reglas generales de las diapositivas de plantilla

1. **Los elementos de la plantilla no se mueven ni se redimensionan** (salvo para ajustar un título largo). Se rellenan sustituyendo su texto.
2. **Todo texto de ejemplo de la plantilla se sustituye o se elimina**: «Escribe aquí…», «__ minutos», «Sustituye por tu fotografía», «Pie de foto 1», «Título del ejemplo…», «PLANTILLA DE CLASE». No puede quedar ningún campo sin rellenar.
3. **La píldora del tipo** («CONCEPTO», «EJEMPLO»…) admite como máximo **14 caracteres**.
4. **El kicker** («TEMA 1 · EXPLICACIÓN») cambia con el tema/unidad y el tipo de diapositiva, y va en mayúsculas.
5. **Al clonar una diapositiva de la plantilla** hay que copiar también su fondo (`<p:bg>` vive en la propia diapositiva, no en el layout; si no, la copia sale con fondo blanco).
6. **El logo no se copia como XML** entre diapositivas: se extrae la imagen y se inserta de nuevo.

## 2.4 Tamaños de letra

Norma vigente (14-oct-2026), sobre un lienzo de 720 pt de ancho:

| Elemento | Mínimo | Máximo | Notas |
|---|---|---|---|
| Títulos | 24 pt | 25 pt | La plantilla usa 25 pt (Concepto), 22 pt (Ejemplo, ejemplo visual), 21 pt (Actividad). Si el título es largo, baja por tramos (≤40 caracteres → 22 · ≤56 → 18 · ≤66 → 16 · más → 14) y se marca como «decisión a revisar» |
| Cuerpo y listas | 12 pt | 14 pt | La plantilla usa 14–14,5 pt. **Si no cabe, se divide en dos diapositivas; no se encoge** |
| Tarjetas, tablas y esquemas | 11 pt | 12 pt | |
| Etiquetas, chips y pies | 10 pt | 10,5 pt | |
| Código | 10 pt | — | Ideal 11–13 pt en Consolas o Courier |
| Portada | véase 2.5 | | |

Reglas de texto:

1. **Una idea por diapositiva.** Si una diapositiva explica dos temas, se parte en dos. Los títulos de las partes llevan «(1/2)», «(2/2)» y los títulos no se repiten entre diapositivas consecutivas.
2. **No aparece letra diminuta.** Una diapositiva con más del 25 % del texto por debajo de 9,5 pt está mal. Ejemplo real: una presentación tenía el 72 % del texto por debajo de 8 pt equivalentes.
3. **Las tarjetas no se dejan vacías**: si el texto ocupa menos de la mitad de la tarjeta, se sube la letra (hasta ≈16 pt) o se reparte mejor el contenido.
4. **Todo el texto cabe dentro de su caja** y no toca los bordes. Ningún texto encima de otro texto. Se revisa en vista de presentación.
5. Alineación **a la izquierda** (el texto justificado deja huecos entre palabras en cajas estrechas).
6. **Poppins en todo**: Light para el cuerpo, SemiBold para la negrita y los títulos. Ni Calibri, Arial, Times ni Inter. Los fragmentos de código usan Consolas, Courier, Menlo o Cascadia.
7. **Viñetas nativas del programa** (• en el primer nivel y – en el segundo; sangrías 228 600 y 457 200 EMU), no el carácter escrito a mano; tampoco tabuladores ni espacios para alinear.
8. **Énfasis = negrita** (solo palabras completas). Sin cursiva dominante, sin resaltador «fosforito» y sin escribir en mayúsculas continuas. El texto de ejemplo gris claro de la plantilla (`#8A9BA8`) no es un estilo para el cuerpo.
9. **Mayúsculas solo** en el kicker y en las etiquetas. La asignatura de la portada va en minúsculas normales.
10. **Los títulos interrogativos llevan el signo de apertura «¿…?».**
11. **Enlaces en una palabra** («Ver vídeo»), no URLs que ocupan media diapositiva. Un vídeo que en PDF saldría como imagen fija lleva además un enlace en texto visible.
12. **Se escribe al alumnado**: segunda persona o imperativo, frases de unas 20 palabras como máximo, sin notas internas (ni «justificación en el material» ni instrucciones a una IA).
13. **Sin párrafos vacíos ni puntos sueltos** («.» como párrafo propio) ni diapositivas casi vacías.

## 2.5 La portada

Estructura (véase la figura 2.1 y su tabla):

1. **Línea superior = ciclo formativo** (Poppins Medium 12 pt, color de acento). Sustituye a «PLANTILLA DE CLASE»; no puede quedar ese rótulo.
2. **Título = 38 pt**, con «**Unidad N:**» (o «Tema N:» / «Sesión N:») en **Poppins Light** y el nombre en **Poppins SemiBold**. Si el nombre es largo se baja por escalón: 38 → 34 → 30 → 28 → 26 → 24 pt (máximo 3 líneas).
3. **Asignatura · curso o nivel · duración** (Poppins 15 pt, acento): en minúsculas normales, no en mayúsculas.
4. **Profesor/a** (Poppins 12 pt, blanco): con el nombre con el que firma (si firma con un diminutivo, se usa ese), no el inverso ni el completo si no lo usa.
5. **Fecha `dd / mm / aaaa`** (Poppins Light 11 pt): la fecha de entrada, no «Curso 2026/27» ni «2026 – 2027».
6. **Sin correo electrónico** del profesor.

**«Unidad» o «Tema».** Se usa **«Unidad»** siempre, salvo que el profesor use «Tema» (u otro término) en su propio material. **El mismo término** en la portada, en el nombre del archivo y en el listado de subida. El número es el **real** de la unidad, no un contador de orden.

Ejemplo correcto de contenido de portada:

```
TÉCNICO SUPERIOR EN DESARROLLO DE APLICACIONES MULTIPLATAFORMA     ← ciclo (12 pt, acento)
Unidad 2: Desarrollo de Aplicaciones Móviles                       ← «Unidad 2:» Light + nombre SemiBold, 38 pt
Programación multimedia y dispositivos móviles · 2.º DAM · 135 h   ← 15 pt, minúsculas
Nombre Apellidos                                                    ← 12 pt
21 / 10 / 2026                                                      ← dd / mm / aaaa
```

La portada y el cierre son **siempre texto editable** (no imagen), porque los archivos se editan después. Si un PDF entra sin número en la portada, se parchea rehaciendo la línea del título sin tapar lo que hay debajo.

## 2.6 Imágenes en diapositivas

Reglas completas en [04_imagenes](04_imagenes.md). Lo específico de diapositivas:

1. **Proporción original**: jamás estirar. Una deformación mayor del 6 % es un error. Escala uniforme (`min(ancho_caja/ancho, alto_caja/alto)`) y centrada en su marco.
2. **Galería**: 3 marcos de **193 × 176,4 pt** en y = 118,8, en x = 39,6 · 252,0 · 464,4 (separación 19,4 pt) con pie de foto debajo (Poppins Medium 12,5 pt). Zona de imágenes del motor: x 55 · y 112 · ancho 610 · alto 262.
3. **Ejemplo visual**: panel de imagen a sangre de **327,6 × 405 pt** a la izquierda (Sanipro: 327,6 × 405 y la 2.ª variante 197,6 × 405); el texto va a la derecha desde x = 367,2.
4. **La imagen va junto a su texto** (no en una galería aparte «para que quede mejor»). Se mantiene la agrupación que trae el profesor.
5. Antes de colocar una imagen o un recuadro se calcula su **caja** y se comprueba que **no se solapa** con ninguna otra forma de la diapositiva. Si no hay hueco limpio, no se fuerza: se marca para colocación manual.
6. **Transparencias**: no pueden salir como cuadrado negro. Una página negra solo es válida si es una foto/radiografía oscura.

## 2.7 Tablas en diapositivas

Detalle en [05_tablas](05_tablas.md). Lo específico:

1. **Tabla nativa** (no imagen), dentro de la tarjeta: x = 39,6 pt (502 920 EMU) y 640,8 pt de ancho (8 138 160 EMU); filas de ≈ 23,6 pt (300 000 EMU); margen de celda izquierda/derecha 7,2 pt (91 440 EMU) y superior/inferior 3,6 pt (45 720 EMU).
2. **Una sola tabla por diapositiva** en el motor de reconstrucción; si el origen trae más, se usa otro motor o se rehace a mano.
3. **Letra ≥ 11 pt**. Si una tabla es muy densa (9–10 pt), se divide en dos diapositivas repitiendo la cabecera.
4. **Colores de la marca** (cabecera oscura, filas alternas): nunca los estilos por defecto de PowerPoint (lilas y azules).
5. Una tabla puede quedar «vacía» en el PDF si unas formas blancas con animación de salida la ocultan hasta el clic: en ese caso se entrega el `.pptx` o se quitan las formas.

## 2.8 Código y esquemas

1. **El código es texto**, en un bloque monoespaciado (Consolas o Courier) de **≥ 10 pt (ideal 11–13)**, **completo** y con sangría que enseñe la estructura. Nunca una captura de pantalla con letra diminuta. Si no cabe, se divide en dos diapositivas.
2. **Estilo «Ayu Mirage»** (norma del 21-oct-2026): bloque de **fondo oscuro `#1F2430`** con esquinas suaves, texto base `#CBCCC6`, palabras clave `#FFA759`, tipos y funciones `#FFD580`, cadenas `#BAE67E`, números y operadores `#FFCC66` y comentarios `#5C6773` en cursiva. La **etiqueta del lenguaje** (`KOTLIN`, `XML`…) va arriba a la derecha en `#5C6773`, 8 pt.
3. El texto va con **espacios normales** (no espacios duros) y en un solo cuadro de texto, para que se pueda **seleccionar, copiar y pegar** como código válido. En una diapositiva o PDF no hay botón de copiar (véase [06 §6.3](06_markdown_texto_codigo_y_oro.md#63-bloques-de-código)).

![Código en una diapositiva con Ayu Mirage](img/ejemplo_codigo_ayu_kotlin.png)

*Figura 2.9. Diapositiva con código Kotlin en estilo Ayu Mirage.*

4. Los esquemas se hacen con **formas nativas** (cajas, flechas) y texto real, no con imágenes con rótulos.
5. Si hay que leer texto de una imagen, se transcribe a elementos nativos y se avisa de que se ha leído de una imagen.

## 2.9 Cierre

1. La última diapositiva es la de la plantilla: **«¿Preguntas?»** con el texto «Espacio abierto para dudas, comentarios o reflexiones sobre lo visto hoy» (puede sustituirse por una frase propia breve) y el **número de diapositiva** de la plantilla.
2. No se añade «Gracias», «Cierre de la unidad», una diapositiva solo con un logo ni un número de página suelto.
3. Es una de las correcciones más repetidas: apareció en unos 14 de los 24 feedbacks revisados.

## 2.10 Qué motor usar (árbol de decisión)

Antes de tocar nada: **renderizar la página 1 y algunas intermedias y mirarlas**.

```
¿El archivo ya viene exportado desde la plantilla oficial (logo, paleta, portada «Tema N: Título»)?
 ├─ Sí → NO se reconstruye. Solo QA: erratas reales, colores sueltos, logo que falta, portada. Nunca redecorar.
 └─ No
     ├─ Es un .pptx nativo del profesor → PARCHE CONSERVADOR (restyle): plantilla + colores + tipografía de la marca;
     │    se conserva su distribución (qué va junto y qué va en su propia diapositiva).
     └─ Es un PDF (o Canva, Google sin plantilla) → RECONSTRUIR 1:1 sobre la plantilla oficial:
          extraer texto e imágenes página a página, tablas nativas, diagramas con formas nativas,
          cada imagen respetando su proporción. Sin inventar contenido ni reinterpretar el diseño.
```

Aviso: «Google Shape» en el nombre de las formas solo indica que el archivo se exportó desde Google Slides; **no** prueba que use la plantilla oficial.

Los PDF también se maquetan (decisión del 6-oct-2026) para que el material quede limpio sin perder la esencia del profesor: su contenido, su orden y sus ejemplos.

## 2.11 Exportación y entrega

1. **PDF para lo estático.** Si hay animaciones que ocultan contenido (por ejemplo, tapaderas que descubren una tabla), se entrega el **`.pptx`** (la plataforma lo acepta con animaciones).
2. **Poppins Light sale como Thin en el PDF**: sustituir en el XML `Poppins Light`/`Poppins Thin` por `Poppins` antes de exportar, o corregir después con `fix_poppins_weights.py` comprobando que el texto no cambia. Nunca entregar un PDF con spans «Thin» ≥ 9 pt.
3. **Peso**: una presentación muy pesada (16–24 MB) que la plataforma no acepta se recomprime (PNG > 60 KB → JPG al 84 %, máximo 1 600 px; si falla, 1 200 px), conservando transparencias y animaciones.
4. **Nombre del archivo corto, sin tildes, rayas ni comas** (algunos nombres hacen que un PDF no abra en la plataforma por la URL del CDN, con el mismo contenido): `<ASIGNATURA>_Presentacion_Unidad_<N>.pdf`.
5. **Nombre en la plataforma**: «Presentación Unidad N» / «Presentación Tema N» / «Presentación Sesión N» y nada más, en la carpeta **«Recursos extras»** de la asignatura.
6. **El original no se pisa**: va en `ORIGINAL - sin corregir/`; el trabajo se guarda en una copia con nombre distinto.
7. Lo ya subido sin fallo **no se rehace**; solo se corrige lo que está «muy mal» (letra Thin ilegible, texto cortado, fuera de plantilla).

## 2.12 Control de calidad de una presentación

Antes de dar una presentación por buena:

1. **Renderizar** con `soffice --headless --convert-to pdf` y `pdftoppm -jpeg -r 100` y **mirar cada diapositiva** una a una (no una muestra ni la miniatura).
2. **Diff de texto** origen frente a salida: cero palabras perdidas; baseline del texto de todas las formas antes de editar.
3. **Imágenes**: contar y comparar con el original (p. ej. 23 de 23); proporción (deformada > 6 %); resolución efectiva (ppi = píxeles / ancho en pulgadas; baja < 96 ppi).
4. **Colores**: extraer colores y compararlos con la paleta; detector de píxeles verdes en el PDF (a 30 dpi: `g > 100`, `g > r + 25`, `g > b + 25`; aviso si la media supera 0,002 de la página).
5. **Thin**: escanear los spans del PDF.
6. **Ortografía**: `hunspell -d …/dict-es/es_ES -l` sobre el texto y confirmar cada palabra en contexto. Corregir solo erratas evidentes y decirlo.
7. **Portada**: ciclo, «Unidad N: nombre» a 38 pt, asignatura en minúsculas, profesor, fecha `dd / mm / aaaa`, sin correo; cierre «¿Preguntas?».
8. **Coherencia**: mismo número y nombre de unidad en portada, cabeceras, mapa e índices y nombre de archivo.
9. **Placeholders**: ninguno («Sustituye…», «__ minutos», «PLANTILLA DE CLASE»).
10. **Todo lo que se añade** (etiquetas «TABLA»/«ESQUEMA», títulos nuevos, texto transcrito de una imagen) se comunica al profesor como «decisión a revisar».
