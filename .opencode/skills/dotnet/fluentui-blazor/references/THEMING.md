# Theming

## FluentDesignTheme (recommended)

The primary theming component. Place it at the root of your app.

```razor
<FluentDesignTheme Mode="DesignThemeModes.System"
                   OfficeColor="OfficeColor.Teams"
                   StorageName="mytheme" />
```

### Parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| `Mode` | `DesignThemeModes` | `System` | `Light`, `Dark`, or `System` (follows OS) |
| `CustomColor` | `string?` | null | Hex accent color (e.g. `"#0078D4"`) |
| `OfficeColor` | `OfficeColor?` | null | Preset accent: `Teams`, `Word`, `Excel`, `PowerPoint`, `Outlook`, `OneNote` |
| `NeutralBaseColor` | `string?` | null | Neutral palette base hex color |
| `StorageName` | `string?` | null | Persist theme to localStorage under this key |
| `Direction` | `LocalizationDirection?` | null | `Ltr` or `Rtl` |
| `OnLuminanceChanged` | `EventCallback<LuminanceChangedEventArgs>` | | Fired when dark/light mode changes |
| `OnLoaded` | `EventCallback<LoadedEventArgs>` | | Fired when theme is loaded from storage |

### Two-way binding

```razor
<FluentDesignTheme @bind-Mode="@themeMode"
                   @bind-OfficeColor="@officeColor"
                   @bind-CustomColor="@customColor"
                   StorageName="mytheme" />

<FluentSelect Items="@(Enum.GetValues<DesignThemeModes>())"
              @bind-SelectedOption="@themeMode"
              OptionText="@(m => m.ToString())" />

@code {
    private DesignThemeModes themeMode = DesignThemeModes.System;
    private OfficeColor? officeColor = OfficeColor.Teams;
    private string? customColor;
}
```

### Important: JS interop dependency

`FluentDesignTheme` uses JavaScript interop internally. It will NOT work during server-side pre-rendering. If you need to react to theme changes:

```csharp
// Use OnAfterRenderAsync, NOT OnInitialized
protected override async Task OnAfterRenderAsync(bool firstRender)
{
    if (firstRender)
    {
        // Safe to interact with design tokens here
    }
}
```

## FluentDesignSystemProvider (advanced)

For scoping design tokens to a subtree of the component tree. Provides 50+ CSS custom properties.

```razor
<FluentDesignSystemProvider AccentBaseColor="#0078D4"
                            NeutralBaseColor="#808080"
                            BaseLayerLuminance="0.95">
    <FluentButton Appearance="Appearance.Accent">Themed Button</FluentButton>
</FluentDesignSystemProvider>
```

## Design Token Classes (DI-based, advanced)

For programmatic token control via dependency injection. Each token is a generated service.

```csharp
@inject AccentBaseColor AccentBaseColor

protected override async Task OnAfterRenderAsync(bool firstRender)
{
    if (firstRender)
    {
        // Set token for a specific element
        await AccentBaseColor.SetValueFor(myElement, "#FF0000".ToSwatch());

        // Read token value
        var currentColor = await AccentBaseColor.GetValueFor(myElement);

        // Remove override
        await AccentBaseColor.DeleteValueFor(myElement);
    }
}
```

## Available DesignThemeModes

- `DesignThemeModes.Light` — light theme
- `DesignThemeModes.Dark` — dark theme
- `DesignThemeModes.System` — follows OS preference

## Available OfficeColor presets

`Teams`, `Word`, `Excel`, `PowerPoint`, `Outlook`, `OneNote`, `Loop`, `Planner`, `SharePoint`, `Stream`, `Sway`, `Viva`, `VivaEngage`, `VivaInsights`, `VivaLearning`, `VivaTopics`.
