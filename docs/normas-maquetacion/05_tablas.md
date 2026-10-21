# 05 · Tablas

> Cómo deben ser las tablas en presentaciones y en documentos: colores por marca, cabecera, bordes, filas alternas, primera columna, partición entre páginas, tamaño de letra y errores frecuentes.

## 5.1 Reglas generales

1. **Tabla nativa, nunca imagen.** Una tabla pegada como imagen pierde nitidez, tiene la letra pequeña y no se puede editar.
2. **Colores de la marca.** Cabecera oscura (`dark`) con texto blanco; filas alternas con el color «cebra» o crema de la marca; bordes en el color de línea. **Jamás** los estilos por defecto de PowerPoint (lilas y azules) ni verdes, amarillos o azules ajenos a la marca.
3. **Cabecera clara**: una fila de cabecera siempre; en documentos largos la cabecera **se repite en cada página**.
4. **Primera columna en negrita** (peso 600) y color `dark`, salvo que la tabla tenga una sola columna.
5. **Dentro de su recuadro.** La tabla no se sale de la tarjeta ni roza el borde; el texto de cada celda cabe y se ajusta a su contenido.
6. **Letra legible**: en diapositivas **≥ 11 pt**; en documentos 8,8–10,5 pt según el motor. Si es muy densa, se **divide en dos** repitiendo la cabecera.
7. **Una idea por tabla.** Un cuadro comparativo, no un volcado de datos.
8. **Ninguna fila se parte** entre páginas (en documentos) y ninguna celda queda vacía sin motivo (si falta un dato se avisa; no se inventa).

## 5.2 Tabla frente a tabla: valores por motor

| Aspecto | Presentaciones (plantilla) | Documento de apoyo | Anexo Word → PDF | Temario Prometeo (unidad) |
|---|---|---|---|---|
| Letra | **≥ 11 pt** (ideal 11–12) | 8,8 pt, interlineado 1,45 | 9 pt, interlineado 1,4 | 10,5 px |
| Cabecera | Fondo `dark`, texto blanco | Fondo `dark`, texto blanco, 600, alineada a la izquierda | Fondo `dark`, texto blanco | **Verde claro `#CBDECF`**, negrita centrada |
| Primera columna | Color medio de la marca (`mid`) en Prometeo | 600, color `dark`, ancho mínimo 26 mm | 600, color `dark` | Sin negrita especial |
| Filas | Alternas `card`/`zebra` | Pares en `zebra` | Cebra | Sin cebra |
| Bordes | Color `line` | 0,6 pt `line`; contorno 0,7 pt, radio 2 mm | 0,6 pt `line` | **`1px solid #152A1D`** |
| Relleno de celda | Izq/der 7,2 pt · sup/inf 3,6 pt | 2,1 × 2,8 mm | — | 6 × 8 px |
| Cabecera repetida | n/a | **Sí** (`thead` repite) | **Sí** | No |
| Partición entre páginas | n/a | La fila no se parte (`tr` sin cortar), la tabla sí | La tabla puede partirse | **No se parte** (la tabla entera, o no cabe) |
| Pie/título | Opcional | `caption` solo por API (600, 9 pt, `mid`) | — | Marcador `[TABLA/GRÁFICO: …]` antes → pie en cursiva |
| Una sola columna | — | La primera columna en peso normal (clase `uno`) | — | — |

### Colores de tabla en presentaciones por marca

| Marca | Cabecera | 1.ª columna | Filas | Línea |
|---|---|---|---|---|
| Prometeo | `152A1D` (texto blanco) | `2C4436` | `F7F3EE` / `FBF8F5` | `F3E6DA` |
| Sanipro | `245578` (texto blanco) | `336D93` (tono medio) | `F4FAFC` (alternas) | `CFE7EF` |
| Edentia | `152932` (texto blanco) | `2C4954` | `EDF3F0` / `F6FAF8` | `C7D8D1` |

*(Prometeo y Sanipro están documentados en las incidencias reales; Edentia se deduce por analogía con la paleta oficial.)*

## 5.3 Medidas de una tabla en diapositiva

- Posición: x = **39,6 pt** y ancho **640,8 pt** (la anchura de la tarjeta), dentro de la tarjeta de contenido.
- Filas de **≈ 23,6 pt** (300 000 EMU); alto total máximo = alto de la tarjeta (255,6 pt).
- Margen de celda: **izquierda/derecha 7,2 pt**, **superior/inferior 3,6 pt**.
- Anchos de columna proporcionales a `longitud^0,7` del contenido (con un factor 1,6), para que las columnas con más texto no se aprieten.
- **Una sola tabla por diapositiva** en el motor de reconstrucción (si el origen trae más, otra vía).
- División: si la tabla no cabe a ≥ 11 pt, se parte por la mitad (`filas // 2 + 1`), repitiendo la cabecera y usando 10,5 pt como mínimo de último recurso.

## 5.4 Errores reales

### Tablas con colores ajenos a la marca

![Tabla en azul por defecto](img/casos/a_tabla_azul.jpg)

*Figura 5.1. Una tabla con el azul por defecto del programa dentro de una presentación de Prometeo.*

![Tabla con la paleta de la marca](img/casos/b_tabla_marca.jpg)

*Figura 5.2. La misma tabla con cabecera `152A1D`, primera columna en tono medio y filas crema.*

| Error | Causa | Detección | Corrección |
|---|---|---|---|
| Tablas con estilo por defecto (lilas, azules); cuadros con borde azul | Estilo de tabla por defecto | Extraer con python-pptx el color de celdas y bordes | Recolorear por rol a la paleta de la marca |
| Tabla que se sale del recuadro o roza el borde | Tabla o imagen sin ajustar | Render y cálculo de la caja | Tabla nativa dentro de la tarjeta |
| Tabla muy densa (9–10 pt) | Demasiado contenido | Tamaño medio < 11 pt | Dividir en dos o subir a 11–12 pt |
| Varias tablas por diapositiva; solo se conserva una | Límite del motor de reconstrucción | Contar las tablas del origen | Rehacer como documento o a mano |
| **Tabla vacía en el PDF** | Formas blancas con animación de salida que la ocultan hasta el clic; el PDF no ejecuta animaciones | Buscar formas con animación `exit` sobre tablas | Entregar el `.pptx` (la plataforma acepta animaciones) o quitar las «tapaderas» |
| Tablas pegadas como imagen, con tipografía serif | Pegado desde el chat o la web | Revisión | Transcribir a tabla nativa y avisar de que se leyó de una imagen |
| Título de tabla o etiqueta añadida por el maquetador | Decisión propia | — | Comunicarlo como «decisión a revisar» |
| Tabla repetida idéntica en dos diapositivas seguidas | Copia del autor | Comparar texto | No se borra sin permiso: se avisa |

### Una columna con comentarios para el profesor

Una tabla con una columna llamada «Justificación en el Material» (frases como «Indicado como un pilar central para el perfil de DAM») mezcla notas internas con contenido para el alumnado. Regla: **las columnas de una tabla hablan al alumnado**; se reescribe con «Por qué lo usamos».

![Tabla con columna para el profesor](img/casos/a_justif.jpg)

*Figura 5.3. Columna «Justificación en el Material».*

![Tabla reescrita para el alumnado](img/casos/b_justif.jpg)

*Figura 5.4. Misma tabla con la columna «Por qué lo usamos».*
