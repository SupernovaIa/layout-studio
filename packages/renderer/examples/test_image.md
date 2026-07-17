---
titulo: Prueba de imágenes PNG
eyebrow: Renderer · imágenes
---

# Prueba de imágenes PNG

Este documento verifica que una imagen referenciada como fichero externo se
embebe correctamente en el PDF, escalada al ancho de columna manteniendo la
proporción.

## Imagen presente

El siguiente diagrama debería aparecer como una imagen real, centrada:

![Diagrama de ejemplo](diagram.png)

Texto posterior para comprobar que el flujo continúa por debajo de la imagen
sin solaparse.

## Imagen que falta

Esta referencia apunta a un fichero inexistente y debe degradar a una nota
suave en lugar de romper el render:

![Diagrama ausente](no-existe.png)

Fin del documento.
