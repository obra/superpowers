# FluentDataGrid

`FluentDataGrid<TGridItem>` is a strongly-typed generic component for displaying tabular data.

## Basic Usage

```razor
<FluentDataGrid Items="@people" TGridItem="Person">
    <PropertyColumn Property="@(p => p.Name)" Sortable="true" />
    <PropertyColumn Property="@(p => p.Email)" />
    <PropertyColumn Property="@(p => p.BirthDate)" Format="yyyy-MM-dd" />
    <TemplateColumn Title="Actions">
        <FluentButton OnClick="@(() => Edit(context))">Edit</FluentButton>
    </TemplateColumn>
</FluentDataGrid>
```

**Critical**: Columns are child components, NOT properties. Use `PropertyColumn`, `TemplateColumn`, and `SelectColumn` within the grid.

## Column Types

### PropertyColumn

Binds to a property expression. Auto-derives title from property name or `[Display]` attribute.

```razor
<PropertyColumn Property="@(p => p.Name)" Sortable="true" />
<PropertyColumn Property="@(p => p.Price)" Format="C2" Title="Unit Price" />
<PropertyColumn Property="@(p => p.Category)" Comparer="@StringComparer.OrdinalIgnoreCase" />
```

Parameters: `Property` (required), `Format`, `Title`, `Sortable`, `SortBy`, `Comparer`, `IsDefaultSortColumn`, `InitialSortDirection`, `Class`, `Tooltip`.

### TemplateColumn

Full custom rendering via render fragment. `context` is the `TGridItem`.

```razor
<TemplateColumn Title="Status" SortBy="@statusSort">
    <FluentBadge Appearance="Appearance.Accent"
                 BackgroundColor="@(context.IsActive ? "green" : "red")">
        @(context.IsActive ? "Active" : "Inactive")
    </FluentBadge>
</TemplateColumn>
```

### SelectColumn

Checkbox selection column.

```razor
<SelectColumn TGridItem="Person"
              SelectMode="DataGridSelectMode.Multiple"
              @bind-SelectedItems="@selectedPeople" />
```

Modes: `DataGridSelectMode.Single`, `DataGridSelectMode.Multiple`.

## Data Sources

Two mutually exclusive approaches:

### In-memory (IQueryable)

```razor
<FluentDataGrid Items="@people.AsQueryable()" TGridItem="Person">
    ...
</FluentDataGrid>
```

### Server-side / Custom (ItemsProvider)

```razor
<FluentDataGrid ItemsProvider="@peopleProvider" TGridItem="Person">
    ...
</FluentDataGrid>

@code {
    private GridItemsProvider<Person> peopleProvider = async request =>
    {
        var result = await PeopleService.GetPeopleAsync(
            request.StartIndex,
            request.Count ?? 50,
            request.GetSortByProperties().FirstOrDefault());

        return GridItemsProviderResult.From(result.Items, result.TotalCount);
    };
}
```

### EF Core Adapter

```csharp
// Program.cs
builder.Services.AddDataGridEntityFrameworkAdapter();
```

```razor
<FluentDataGrid Items="@dbContext.People" TGridItem="Person">
    ...
</FluentDataGrid>
```

## Pagination

```razor
<FluentDataGrid Items="@people" Pagination="@pagination" TGridItem="Person">
    ...
</FluentDataGrid>

<FluentPaginator State="@pagination" />

@code {
    private PaginationState pagination = new() { ItemsPerPage = 10 };
}
```

## Virtualization

For large datasets, enable virtualization:

```razor
<FluentDataGrid Items="@people" Virtualize="true" ItemSize="46" TGridItem="Person">
    ...
</FluentDataGrid>
```

`ItemSize` is the estimated row height in pixels (default varies). Important for scroll position calculations.

## Key Parameters

| Parameter | Type | Description |
|---|---|---|
| `Items` | `IQueryable<TGridItem>?` | In-memory data source |
| `ItemsProvider` | `GridItemsProvider<TGridItem>?` | Async data provider |
| `Pagination` | `PaginationState?` | Pagination state |
| `Virtualize` | `bool` | Enable virtualization |
| `ItemSize` | `float` | Estimated row height (px) |
| `ItemKey` | `Func<TGridItem, object>?` | Stable key for `@key` |
| `ResizableColumns` | `bool` | Enable column resize |
| `HeaderCellAsButtonWithMenu` | `bool` | Sortable header UI |
| `GridTemplateColumns` | `string?` | CSS grid-template-columns |
| `Loading` | `bool` | Show loading indicator |
| `ShowHover` | `bool` | Highlight rows on hover |
| `OnRowClick` | `EventCallback<FluentDataGridRow<TGridItem>>` | Row click handler |
| `OnRowDoubleClick` | `EventCallback<FluentDataGridRow<TGridItem>>` | Row double-click handler |
| `OnRowFocus` | `EventCallback<FluentDataGridRow<TGridItem>>` | Row focus handler |

## Sorting

```razor
<PropertyColumn Property="@(p => p.Name)" Sortable="true" IsDefaultSortColumn="true"
                InitialSortDirection="SortDirection.Ascending" />
```

Or with a custom sort:

```razor
<TemplateColumn Title="Full Name" SortBy="@(GridSort<Person>.ByAscending(p => p.LastName).ThenAscending(p => p.FirstName))">
    @context.LastName, @context.FirstName
</TemplateColumn>
```
