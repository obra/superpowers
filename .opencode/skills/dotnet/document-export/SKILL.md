---
name: document-export
description: Use when needing to export data to Excel or PDF formats for reports, analysis, or structured documents
---

# Document Export - Exportacion de Documentos

Genera reportes profesionales en formatos Excel y PDF desde datos estructurados.

**Skills incluidas:**
- generate-excel: Exportacion a Excel (.xlsx)
- generate-pdf: Exportacion a PDF

## Excel Export

### Prerequisito de instalacion

```bash
pip install openpyxl --break-system-packages
```

### Formatos de datos

**Simple (una hoja):**
```json
{
  "headers": ["Nombre", "Score", "Tipo"],
  "rows": [
    ["Ana Garcia", 4.8, "Jefe"],
    ["Luis Martinez", 3.9, "Compañero"]
  ]
}
```

**Multi-hoja (recomendado):**
```json
{
  "title": "Reporte de Evaluaciones",
  "sheets": [
    {
      "name": "Resultados",
      "headers": ["Evaluado", "Auto", "Compañero", "Jefe", "Cliente", "Promedio"],
      "rows": [
        ["Ana Garcia", 4.8, 4.5, 4.9, 4.7, 4.73]
      ],
      "col_widths": [22, 10, 14, 10, 12, 12],
      "totals": false
    }
  ]
}
```

### Opciones por hoja

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `name` | string | Nombre de hoja (max 31 chars) |
| `headers` | string[] | Encabezados de columna |
| `rows` | any[][] | Filas de datos |
| `col_widths` | number[] | Anchos de columna en caracteres |
| `totals` | boolean | Agrega fila de totales |

### Cuando usar Excel

- Exportar datos tabulares a Excel
- Reportes con multiples hojas
- Destinatario necesita filtrar/ordenar datos
- Scores de evaluaciones, metricas, inventarios

### Output Excel

- Portada con titulo y fecha
- Encabezados con fondo azul oscuro
- Filas alternas con bordes suaves
- Tablas nativas de Excel con filtros
- Anchos automaticos si no se especifican
- Encabezado congelado para scroll

---

## PDF Export

### Prerequisito de instalacion

```bash
pip install reportlab --break-system-packages
```

### Formatos de datos

**Tabla simple:**
```json
{
  "headers": ["Col1", "Col2", "Col3"],
  "rows": [
    ["valor1", "valor2", "valor3"]
  ]
}
```

**Multi-seccion (tablas + texto):**
```json
{
  "sections": [
    {
      "title": "Resultados",
      "headers": ["Nombre", "Score"],
      "rows": [["Ana Garcia", "4.8"]]
    },
    {
      "title": "Observaciones",
      "text": "Texto libre de contexto."
    }
  ]
}
```

### Cuando usar PDF

- Generar documentos formales
- Reportes de coverage QA
- Documentacion de analisis
- Descarga de reportes desde endpoints

### Output PDF

- Encabezado con titulo y fecha en cada pagina
- Pie de pagina con numeracion
- Tablas con filas alternas
- Secciones de texto libre entre tablas
- Sin dependencias externas salvo reportlab

---

## Ejemplo de Uso en .NET

```csharp
[HttpGet("export/excel")]
public async Task<IActionResult> ExportExcel()
{
    var data = await _reportService.GetResultsAsync();
    
    var exportData = new
    {
        title = "Reporte de Resultados",
        sheets = new[]
        {
            new
            {
                name = "Resultados",
                headers = new[] { "Nombre", "Score" },
                rows = data.Select(d => new object[] { d.Nombre, d.Score }).ToArray()
            }
        }
    };
    
    return File(_exportService.GenerateExcel(exportData), 
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "reporte.xlsx");
}
```

## Regla de Decision

| Formato | Uso |
|---------|-----|
| **Excel** | Datos tabulares, necesita filtros, exportacion masiva |
| **PDF** | Documentos formales, reportes imprimibles, archival |
