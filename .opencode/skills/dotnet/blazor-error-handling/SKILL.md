---
name: blazor-error-handling
description: Manejo de errores en Blazor WASM - ErrorBoundary, Toast, HttpClient errors, Authentication errors
---

Guía completa para manejo de errores en Blazor WebAssembly .NET 9.

## Arquitectura de errores

```
Backend API Error
       ↓
HttpClient catch
       ↓
Error DTO parsing
       ↓
Toast Notification
       ↓
User sees friendly message
```

## 1. ErrorBoundary Component

Captura errores de renderizado sin crashear la app:

```razor
@* ErrorBoundary.razor *@
<ErrorContent @context="Error" @onerrorevent:stoppropagation>

<div class="error-boundary">
    <FluentIcon Icon=@Icons.Regular.Size24.ErrorCircle />
    <h3>Algo salió mal</h3>
    <p>@Error.Message</p>
    @if (ShowDetails)
    {
        <pre>@Error.StackTrace</pre>
    }
    <FluentButton OnClick="Reload">Recargar</FluentButton>
    <FluentButton Appearance="Appearance.Hypertext" OnClick="Dismiss">
        Cerrar
    </FluentButton>
</div>

</ErrorContent>

@code {
    private bool ShowDetails { get; set; }
    private void Reload() => Navigation.NavigateTo(Navigation.Uri, forceLoad: true);
    private void Dismiss() => Error = null;
}
```

## 2. Toast Service

Notificaciones amigables:

```csharp
// ToastService.cs
public interface IToastService
{
    Task ShowErrorAsync(string title, string message);
    Task ShowSuccessAsync(string title, string message);
    Task ShowWarningAsync(string title, string message);
    Task ShowInfoAsync(string title, string message);
}

// Usage in components:
protected async Task SaveAsync()
{
    try
    {
        await Api.SaveAsync(Data);
        await Toast.ShowSuccessAsync("Guardado", "Los cambios se guardaron correctamente.");
    }
    catch (ApiException ex) when (ex.StatusCode == 403)
    {
        await Toast.ShowErrorAsync("Sin permisos", "No tienes permiso para realizar esta acción.");
    }
    catch (ApiException ex) when (ex.StatusCode == 404)
    {
        await Toast.ShowErrorAsync("No encontrado", "El recurso solicitado no existe.");
    }
    catch (Exception ex)
    {
        await Toast.ShowErrorAsync("Error", "Ocurrió un error inesperado. Por favor intenta de nuevo.");
        Logger.LogError(ex, "Error saving data");
    }
}
```

## 3. HttpClient Error Handling

Wrapper que maneja errores de API:

```csharp
// ApiException.cs
public class ApiException : Exception
{
    public int StatusCode { get; }
    public string? ErrorCode { get; }
    public Dictionary<string, string[]>? Errors { get; }
    
    public ApiException(HttpResponseMessage response)
    {
        StatusCode = (int)response.StatusCode;
        
        var content = await response.Content.ReadAsStringAsync();
        var error = JsonSerializer.Deserialize<ApiErrorDto>(content);
        
        Message = error?.Message ?? response.ReasonPhrase ?? "Unknown error";
        ErrorCode = error?.Code;
        Errors = error?.ValidationErrors;
    }
}

// ApiServiceExtensions.cs
public static async Task<Result<T>> HandleApiAsync<T>(
    this HttpClient http,
    Func<Task<HttpResponseMessage>> request)
{
    try
    {
        var response = await request();
        
        if (response.IsSuccessStatusCode)
        {
            var data = await response.Content.ReadFromJsonAsync<T>();
            return Result<T>.Success(data!);
        }
        
        return Result<T>.Failure(new ApiException(response));
    }
    catch (HttpRequestException ex)
    {
        return Result<T>.Failure(new ApiException
        {
            StatusCode = 0,
            Message = "No se pudo conectar al servidor. Verifica tu conexión a internet."
        });
    }
}
```

## 4. Authentication Error Handling

Manejo de errores de auth sin colgar:

```csharp
// AuthErrorHandler.cs
public async Task HandleAuthErrorAsync(Exception ex)
{
    if (ex is UnauthorizedAccessException)
    {
        await Toast.ShowWarningAsync("Sesión expirada", "Por favor inicia sesión nuevamente.");
        Navigation.NavigateTo("/login", forceLoad: true);
    }
    else if (ex is ForbiddenException)
    {
        await Toast.ShowErrorAsync("Acceso denegado", "No tienes permisos para acceder a este recurso.");
    }
    else
    {
        await Toast.ShowErrorAsync("Error de autenticación", "Ocurrió un error. Por favor intenta de nuevo.");
    }
}
```

## 5. Global Error Handler

En Program.cs:

```csharp
// Configure global error handling
builder.Services.AddScoped<ErrorBoundary>();
builder.Services.AddScoped<IToastService, ToastService>();

// In App.razor
<CascadingAuthenticationState>
    <ErrorBoundary>
        <ChildContent>
            <Router AppAssembly="@typeof(App).Assembly">
                @* routes *@
            </Router>
        </ChildContent>
        <ErrorContent Context="error">
            <ErrorDisplay Error="@error" />
        </ErrorContent>
    </ErrorBoundary>
</CascadingAuthenticationState>
```

## Errores comunes y soluciones

| Error | Mensaje amigable | Acción |
|-------|----------------|--------|
| 401 Unauthorized | "Inicia sesión para continuar" | Redirect a login |
| 403 Forbidden | "No tienes permiso" | Mostrar toast |
| 404 Not Found | "El recurso no existe" | Navegar o mostrar toast |
| 500 Server Error | "Algo salió mal, intenta más tarde" | Log + toast |
| Network Error | "Sin conexión al servidor" | Verificar red |
