# Setup and Configuration

## NuGet Packages

| Package | Purpose |
|---|---|
| `Microsoft.FluentUI.AspNetCore.Components` | Core component library (required) |
| `Microsoft.FluentUI.AspNetCore.Components.Icons` | Icon package (optional, recommended) |
| `Microsoft.FluentUI.AspNetCore.Components.Emojis` | Emoji package (optional) |
| `Microsoft.FluentUI.AspNetCore.Components.DataGrid.EntityFrameworkAdapter` | EF Core adapter for DataGrid (optional) |
| `Microsoft.FluentUI.AspNetCore.Components.DataGrid.ODataAdapter` | OData adapter for DataGrid (optional) |

## Program.cs Registration

```csharp
builder.Services.AddFluentUIComponents();
```

### Configuration Options (LibraryConfiguration)

| Property | Type | Default | Notes |
|---|---|---|---|
| `UseTooltipServiceProvider` | `bool` | `true` | Registers `ITooltipService`. If true, you MUST add `<FluentTooltipProvider>` to layout |
| `RequiredLabel` | `MarkupString` | Red `*` | Custom markup for required field indicators |
| `HideTooltipOnCursorLeave` | `bool` | `false` | Close tooltip when cursor leaves both anchor and tooltip |
| `ServiceLifetime` | `ServiceLifetime` | `Scoped` | Only `Scoped` or `Singleton`. `Transient` throws! |
| `ValidateClassNames` | `bool` | `true` | Validates CSS class names against `^-?[_a-zA-Z]+[_a-zA-Z0-9-]*$` |
| `CollocatedJavaScriptQueryString` | `Func<string, string>?` | `v={version}` | Cache-busting for JS files |

### ServiceLifetime by hosting model

| Hosting model | ServiceLifetime |
|---|---|
| Blazor Server | `Scoped` (default) |
| Blazor WebAssembly Standalone | `Singleton` |
| Blazor Web App (Interactive) | `Scoped` (default) |
| Blazor Hybrid (MAUI) | `Singleton` |

## MainLayout.razor Template

```razor
@inherits LayoutComponentBase

<FluentLayout>
    <FluentHeader Height="50">
        My App
    </FluentHeader>

    <FluentStack Orientation="Orientation.Horizontal" HorizontalGap="0" Style="height: 100%;">
        <FluentNavMenu Width="250" Collapsible="true" Title="Navigation">
            <FluentNavLink Href="/" Icon="@(Icons.Regular.Size20.Home)" Match="NavLinkMatch.All">Home</FluentNavLink>
            <FluentNavLink Href="/counter" Icon="@(Icons.Regular.Size20.NumberSymbol)">Counter</FluentNavLink>
            <FluentNavGroup Title="Settings" Icon="@(Icons.Regular.Size20.Settings)">
                <FluentNavLink Href="/settings/general">General</FluentNavLink>
                <FluentNavLink Href="/settings/profile">Profile</FluentNavLink>
            </FluentNavGroup>
        </FluentNavMenu>

        <FluentBodyContent>
            <FluentStack Orientation="Orientation.Vertical" Style="padding: 1rem;">
                @Body
            </FluentStack>
        </FluentBodyContent>
    </FluentStack>
</FluentLayout>

@* Required providers — place after FluentLayout *@
<FluentToastProvider />
<FluentDialogProvider />
<FluentMessageBarProvider />
<FluentTooltipProvider />
<FluentKeyCodeProvider />

@* Theme — place at root *@
<FluentDesignTheme Mode="DesignThemeModes.System"
                   OfficeColor="OfficeColor.Teams"
                   StorageName="mytheme" />
```

Or use the convenience component:

```razor
<FluentMainLayout Header="@header"
                  NavMenuContent="@navMenu"
                  Body="@body"
                  HeaderHeight="50"
                  NavMenuWidth="250"
                  NavMenuTitle="Navigation" />

@code {
    private RenderFragment header = @<span>My App</span>;
    private RenderFragment navMenu = @<div>
        <FluentNavLink Href="/">Home</FluentNavLink>
    </div>;
    private RenderFragment body = @<div>@Body</div>;
}
```

## _Imports.razor

Add this to your `_Imports.razor`:

```razor
@using Microsoft.FluentUI.AspNetCore.Components
@using Icons = Microsoft.FluentUI.AspNetCore.Components.Icons
```

## Static Web Assets

No manual `<link>` or `<script>` tags are needed. The library uses:
- **CSS**: `reboot.css` (normalization) + component-scoped CSS — auto-loaded via static web assets
- **JS**: `lib.module.js` — auto-loaded via Blazor's JS initializer system
- Component-specific JS (e.g. DataGrid, Autocomplete) — lazy-loaded on demand

All served from `_content/Microsoft.FluentUI.AspNetCore.Components/`.

## Services Registered

Services automatically registered by `AddFluentUIComponents()`:

| Service | Implementation | Purpose |
|---|---|---|
| `GlobalState` | `GlobalState` | Shared application state |
| `IToastService` | `ToastService` | Toast notifications (needs `FluentToastProvider`) |
| `IDialogService` | `DialogService` | Dialogs and panels (needs `FluentDialogProvider`) |
| `IMessageService` | `MessageService` | Message bars (needs `FluentMessageBarProvider`) |
| `IKeyCodeService` | `KeyCodeService` | Keyboard shortcuts (needs `FluentKeyCodeProvider`) |
| `IMenuService` | `MenuService` | Context menus |
| `ITooltipService` | `TooltipService` | Tooltips (needs `FluentTooltipProvider`, opt-in via `UseTooltipServiceProvider`) |
