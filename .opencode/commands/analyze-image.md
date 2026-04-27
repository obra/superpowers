# analyze-image

Analiza imágenes UI/UX y extrae design tokens.

## Uso

```bash
analyze-image --image <ruta> --type <tipo> --format <formato>
```

## Argumentos

| Argumento | Requerido | Default | Descripción |
|-----------|-----------|---------|-------------|
| `--image` | Sí | - | Ruta de la imagen a analizar |
| `--type` | No | `all` | Tipo de extracción: `components`, `colors`, `typography`, `spacing`, `all` |
| `--format` | No | `json` | Formato de output: `json`, `markdown`, `tokens` |

## Ejemplos

### Análisis completo (default)

```bash
analyze-image --image screenshots/homepage.png
```

### Solo componentes

```bash
analyze-image --image screenshots/homepage.png --type components
```

### Reporte en markdown

```bash
analyze-image --image screenshots/homepage.png --format markdown
```

### Design tokens C#

```bash
analyze-image --image screenshots/homepage.png --format tokens
```

## Desde OpenCode TUI

1. **Arrastrar imagen**: Drag & drop de la imagen en el terminal
2. **Invocar agente**: `@vision-analyst analiza esta imagen`
3. **O usar tool directamente**: `analyze-image --image <ruta> --type all`

## Output

### JSON (default)

```json
{
  "image_path": "screenshots/homepage.png",
  "dimensions": {"width": 1920, "height": 1080},
  "components": [...],
  "colors": [...],
  "typography": {...},
  "spacing": [...],
  "fluent_ui_suggestions": [...]
}
```

### Markdown

Reporte formateado con tablas y secciones.

### Design Tokens

Clase C# con design tokens listos para usar.

## Pre-requisitos

Ver `install-vision-deps.sh` para instalación de dependencias.

## Agente relacionado

- `@vision-analyst`: Especialista en análisis de imágenes UI/UX
