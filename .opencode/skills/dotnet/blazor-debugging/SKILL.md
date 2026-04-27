---
name: blazor-debugging
description: Debugging de errores comunes en Blazor WebAssembly - import map, Router, static files, render errors
---

Guía para diagnosticar y resolver errores frecuentes en Blazor WebAssembly .NET 9.

## Errores Comunes

### Error 1: Import Map - Bare Specifier
**Mensaje navegador:** `Ignored an import map value of "_framework/blazor.webassembly": Bare specifier`

**Causa:** El import map usa bare specifier sin extensión.

**Solución en index.html:** Eliminar el import map (no necesario en .NET 9):
```html
<!-- Eliminar esto: -->
<script type="importmap">
  {
    "imports": {
      "_framework/blazor.webassembly": "_framework/blazor.webassembly.js"
    }
  }
</script>

<!-- Usar simplemente: -->
<script src="_framework/blazor.webassembly.js"></script>
```

### Error 2: Preload Warning
**Mensaje:** `The resource was preloaded using link preload but not used`

**Causa:** El link preload de Blazor no es compatible con el navegador.

**Solución:** Eliminar el preload:
```html
<!-- Eliminar: -->
<link rel="preload" href="_framework/blazor.webassembly.js" as="script" />
```

### Error 3: Router - NotFoundPage propiedad
**Mensaje:** `Router does not have a property matching the name 'NotFoundPage'`

**Causa:** La propiedad NotFoundPage fue renombrada a NotFound en .NET 8+.

**Solución en App.razor:**
```razor
<!-- Incorrecto (.NET 7): -->
<Router AppAssembly="@typeof(App).Assembly" NotFoundPage="typeof(Pages.NotFound)">

<!-- Correcto (.NET 8/9): -->
<Router AppAssembly="@typeof(App).Assembly">
    <Found Context="routeData">
        <RouteView RouteData="@routeData" DefaultLayout="@typeof(MainLayout)"/>
    </Found>
    <NotFound>
        <LayoutView Layout="@typeof(MainLayout)">
            <Pages.NotFound />
        </LayoutView>
    </NotFound>
</Router>
```

### Error 4: Static Files no se sirven
**Mensaje:** Solo API responde, no carga Blazor

**Causa:** Rutas de wwwroot incorrectas en Program.cs

**Solución:** Usar rutas absolutas:
```csharp
var projectDir = AppContext.BaseDirectory;
var solutionDir = Path.GetFullPath(Path.Combine(projectDir, "..", "..", "..", ".."));
var clientWwwroot = Path.Combine(solutionDir, "src", "Project.Client", "wwwroot");
```

### Error 5: No element associated with component
**Mensaje:** `Error: No element is currently associated with component X`

**Causa:** Componente trying to render before element is ready, o hay un error de renderizado previa.

**Solución:** 
- Revisar si hay un error anterior que está ocultando el problema real
- Verificar que el componente existe y está correctamente registrado

### Error 6: HTTPS Redirect
**Mensaje:** `La conexión para este sitio no es segura`

**Causa:** UseHttpsRedirection() activo en desarrollo.

**Solución:** Comentar en Program.cs:
```csharp
// app.UseHttpsRedirection(); // Comentar en desarrollo
```

Y en launchSettings.json:
```json
"applicationUrl": "http://localhost:5090"
```

## Checklist de Debugging

1. [ ] Ver build con `dotnet build`
2. [ ] Revisar launchSettings.json - puertos correctos
3. [ ] Revisar index.html - sin import map problemático
4. [ ] Verificar Program.cs DI order
5. [ ] Limpiar bin/obj y rebuild
6. [ ] Verificar consola del navegador

## Herramientas de Debug

| Herramienta | Uso |
|------------|-----|
| Browser DevTools Console | Ver errores JavaScript |
| Network tab | Ver requests fallidos |
| dotnet build | Errores de compilación |
| dotnet run --urls | Verificar puertos |
