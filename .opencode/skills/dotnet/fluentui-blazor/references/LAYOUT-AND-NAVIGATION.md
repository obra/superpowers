# Layout and Navigation

## Layout Components

### FluentLayout

Root layout container. Use as the outermost structural component.

```razor
<FluentLayout Orientation="Orientation.Vertical">
    <FluentHeader>...</FluentHeader>
    <FluentBodyContent>...</FluentBodyContent>
    <FluentFooter>...</FluentFooter>
</FluentLayout>
```

### FluentHeader / FluentFooter

Sticky header and footer sections within `FluentLayout`.

```razor
<FluentHeader Height="50">
    <FluentStack Orientation="Orientation.Horizontal" HorizontalAlignment="HorizontalAlignment.SpaceBetween">
        <span>App Title</span>
        <FluentButton>Settings</FluentButton>
    </FluentStack>
</FluentHeader>
```

### FluentBodyContent

Main scrollable content area within `FluentLayout`.

### FluentStack

Flexbox container for horizontal or vertical layouts.

```razor
<FluentStack Orientation="Orientation.Horizontal"
             HorizontalGap="10"
             VerticalGap="10"
             HorizontalAlignment="HorizontalAlignment.Center"
             VerticalAlignment="VerticalAlignment.Center"
             Wrap="true"
             Width="100%">
    <FluentButton>One</FluentButton>
    <FluentButton>Two</FluentButton>
</FluentStack>
```

Parameters: `Orientation`, `HorizontalGap`, `VerticalGap`, `HorizontalAlignment`, `VerticalAlignment`, `Wrap`, `Width`.

### FluentGrid / FluentGridItem

12-column responsive grid system.

```razor
<FluentGrid Spacing="3" Justify="JustifyContent.Center" AdaptiveRendering="true">
    <FluentGridItem xs="12" sm="6" md="4" lg="3">
        Card 1
    </FluentGridItem>
    <FluentGridItem xs="12" sm="6" md="4" lg="3">
        Card 2
    </FluentGridItem>
</FluentGrid>
```

Size parameters (`xs`, `sm`, `md`, `lg`, `xl`, `xxl`) represent column spans out of 12. Use `AdaptiveRendering="true"` to hide items that don't fit.

### FluentMainLayout (convenience)

Pre-composed layout with header, nav menu, and body area.

```razor
<FluentMainLayout Header="@header"
                  SubHeader="@subheader"
                  NavMenuContent="@navMenu"
                  Body="@body"
                  HeaderHeight="50"
                  NavMenuWidth="250"
                  NavMenuTitle="Navigation" />
```

## Navigation Components

### FluentNavMenu

Collapsible navigation menu with keyboard support.

```razor
<FluentNavMenu Width="250"
               Collapsible="true"
               @bind-Expanded="@menuExpanded"
               Title="Main navigation"
               CollapsedChildNavigation="true"
               Margin="4px 0">
    <FluentNavLink Href="/" Icon="@(Icons.Regular.Size20.Home)" Match="NavLinkMatch.All">
        Home
    </FluentNavLink>
    <FluentNavLink Href="/counter" Icon="@(Icons.Regular.Size20.NumberSymbol)">
        Counter
    </FluentNavLink>
    <FluentNavGroup Title="Admin" Icon="@(Icons.Regular.Size20.Shield)" @bind-Expanded="@adminExpanded">
        <FluentNavLink Href="/admin/users">Users</FluentNavLink>
        <FluentNavLink Href="/admin/roles">Roles</FluentNavLink>
    </FluentNavGroup>
</FluentNavMenu>
```

Key parameters:
- `Width` — width in pixels (40px when collapsed)
- `Collapsible` — enables expand/collapse toggle
- `Expanded` / `ExpandedChanged` — bindable collapse state
- `CollapsedChildNavigation` — shows flyout menus for groups when collapsed
- `CustomToggle` — for mobile hamburger button patterns
- `Title` — aria-label for accessibility

### FluentNavGroup

Expandable group within a nav menu.

```razor
<FluentNavGroup Title="Settings"
                Icon="@(Icons.Regular.Size20.Settings)"
                @bind-Expanded="@settingsExpanded"
                Gap="2">
    <FluentNavLink Href="/settings/general">General</FluentNavLink>
    <FluentNavLink Href="/settings/profile">Profile</FluentNavLink>
</FluentNavGroup>
```

Parameters: `Title`, `Expanded`/`ExpandedChanged`, `Icon`, `IconColor`, `HideExpander`, `Gap`, `MaxHeight`, `TitleTemplate`.

### FluentNavLink

Navigation link with active state tracking.

```razor
<FluentNavLink Href="/page"
               Icon="@(Icons.Regular.Size20.Document)"
               Match="NavLinkMatch.Prefix"
               Target="_blank"
               Disabled="false">
    Page Title
</FluentNavLink>
```

Parameters: `Href`, `Target`, `Match` (`NavLinkMatch.Prefix` default, or `All`), `ActiveClass`, `Icon`, `IconColor`, `Disabled`, `Tooltip`.

All nav components inherit from `FluentNavBase` which provides: `Icon`, `IconColor`, `CustomColor`, `Disabled`, `Tooltip`.

### FluentBreadcrumb / FluentBreadcrumbItem

```razor
<FluentBreadcrumb>
    <FluentBreadcrumbItem Href="/">Home</FluentBreadcrumbItem>
    <FluentBreadcrumbItem Href="/products">Products</FluentBreadcrumbItem>
    <FluentBreadcrumbItem>Current Page</FluentBreadcrumbItem>
</FluentBreadcrumb>
```

### FluentTab / FluentTabs

```razor
<FluentTabs @bind-ActiveTabId="@activeTab">
    <FluentTab Id="tab1" Label="Details">
        Details content
    </FluentTab>
    <FluentTab Id="tab2" Label="History">
        History content
    </FluentTab>
</FluentTabs>
```
