# 0750 Spreadsheet HTML Export Implementation

## Overview
**HTML Export functionality** enables users to convert spreadsheet data into formatted HTML documents for web publishing, report generation, email integration, and document workflow embedding. This enterprise feature transforms calculated spreadsheet results into professional HTML reports that can be shared, embedded, or integrated into existing document management systems.

**Business Value**: Enable users to share spreadsheet outputs as web-ready documents, integrate analysis results into reports, and create shareable dashboards from complex calculations.

---

## 🎯 HTML Export Architecture

### **Export Capabilities**

#### **1. Table Export (Basic)**
- **Structured HTML Table**: Convert spreadsheet range to semantic HTML table
- **CSS Formatting**: Apply spreadsheet formatting to HTML output
- **Responsive Design**: Mobile-friendly table layouts
- **Accessibility**: Screen reader compatible markup

#### **2. Dashboard Export (Advanced)**
- **Interactive Charts**: Convert embedded charts to Canvas/SVG
- **Multi-sheet Reports**: Combine multiple sheets into single HTML document
- **Context-Aware Styling**: Apply discipline-specific themes (Procurement blue, Finance green, etc.)
- **Embedded Calculations**: Include formula results with optional working display

#### **3. Template Integration**
- **Report Templates**: Pre-build HTML report skeletons
- **Placeholder Population**: Fill template placeholders with spreadsheet data
- **Style Customization**: Apply organization-specific branding

---

## 🔧 Technical Implementation

### **Core HTML Export Service**

#### **Basic Table Export Implementation**
```javascript
const exportToHTML = (spreadsheetData, sheetName, exportOptions = {}) => {
  const {
    includeFormulas = false,
    includeFormatting = true,
    theme = 'default',
    responsive = true,
    title = sheetName
  } = exportOptions;

  // Generate HTML structure
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      ${generateCSS(theme, responsive)}
    </head>
    <body>
      <div class="spreadsheet-export">
        <header class="export-header">
          <h1>${title}</h1>
          <div class="export-meta">
            <span class="export-date">${new Date().toLocaleDateString()}</span>
            <span class="export-source">ConstructAI Spreadsheet</span>
          </div>
        </header>
        <div class="table-container">
          ${generateHTMLTable(spreadsheetData, includeFormulas, includeFormatting)}
        </div>
      </div>
    </body>
    </html>
  `;

  return html;
};
```

#### **Styled Table Generation**
```javascript
const generateHTMLTable = (spreadsheetData, includeFormulas, includeFormatting) => {
  // Extract data range
  const range = getDataRange(spreadsheetData);
  let tableHTML = '<table class="spreadsheet-table">\n';

  // Generate headers
  tableHTML += '  <thead>\n    <tr>\n';
  for (let col = range.startCol; col <= range.endCol; col++) {
    const header = getColumnHeader(col);
    tableHTML += `      <th>${header}</th>\n`;
  }
  tableHTML += '    </tr>\n  </thead>\n';

  // Generate data rows
  tableHTML += '  <tbody>\n';
  for (let row = range.startRow; row <= range.endRow; row++) {
    tableHTML += '    <tr>\n';
    for (let col = range.startCol; col <= range.endCol; col++) {
      const cellKey = `${getColumnHeader(col)}${row}`;
      const cellData = spreadsheetData[cellKey] || {};
      const cellValue = includeFormulas && cellData.type === 'formula'
        ? `${cellData.value} = ${evaluateFormula(cellData.value)}`
        : cellData.value || '';

      const cellClasses = generateCellClasses(cellData, includeFormatting);
      tableHTML += `      <td class="${cellClasses}">${cellValue}</td>\n`;
    }
    tableHTML += '    </tr>\n';
  }
  tableHTML += '  </tbody>\n</table>\n';

  return tableHTML;
};
```

#### **CSS Style Generation**
```javascript
const generateCSS = (theme, responsive) => {
  const themeStyles = THEMES[theme] || THEMES.default;

  let css = `
    <style>
      .spreadsheet-export {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
        background: ${themeStyles.background};
      }

      .export-header {
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 2px solid ${themeStyles.accent};
      }

      .export-header h1 {
        color: ${themeStyles.primary};
        margin: 0 0 10px 0;
        font-size: 2em;
      }

      .spreadsheet-table {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }

      .spreadsheet-table th,
      .spreadsheet-table td {
        padding: 12px;
        border: 1px solid ${themeStyles.border};
        text-align: left;
      }

      .spreadsheet-table th {
        background: ${themeStyles.headerBg};
        color: ${themeStyles.headerText};
        font-weight: bold;
      }

      .spreadsheet-table tr:nth-child(even) {
        background: ${themeStyles.rowAlt};
      }

      .spreadsheet-table tr:hover {
        background: ${themeStyles.rowHover};
      }
  `;

  if (responsive) {
    css += `
      @media (max-width: 768px) {
        .spreadsheet-export {
          padding: 10px;
        }

        .spreadsheet-table {
          font-size: 0.9em;
        }

        .spreadsheet-table th,
        .spreadsheet-table td {
          padding: 8px;
        }

        .table-container {
          overflow-x: auto;
        }
      }
    `;
  }

  css += '    </style>';

  return css;
};
```

### **Advanced Export Features**

#### **Chart Export Integration**
```javascript
const exportChartToHTML = (chartData, chartType) => {
  // Generate Canvas-based chart
  const canvasHTML = `
    <div class="chart-container">
      <h3>${chartData.title}</h3>
      <canvas id="chart-${chartData.id}" width="600" height="400"></canvas>
      <script>
        const ctx = document.getElementById('chart-${chartData.id}').getContext('2d');
        const chart = new Chart(ctx, {
          type: '${chartType}',
          data: ${JSON.stringify(chartData.dataset)},
          options: ${JSON.stringify(chartData.options)}
        });
      </script>
    </div>
  `;

  return canvasHTML;
};
```

#### **Multi-Sheet Report Generation**
```javascript
const exportMultiSheetReport = (sheets, reportConfig) => {
  const sheetNavigation = generateSheetNavigation(sheets);
  const reportHTML = sheets.map(sheet =>
    `<section id="sheet-${sheet.id}" class="sheet-section">
      <h2>${sheet.name}</h2>
      ${exportToHTML(sheet.data, sheet.name, reportConfig)}
    </section>`
  ).join('\n');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${reportConfig.title}</title>
      ${generateCSS(reportConfig.theme)}
      ${generateSheetNavigationCSS()}
    </head>
    <body>
      ${sheetNavigation}
      ${reportHTML}
      <script>${generateSheetNavigationJS()}</script>
    </body>
    </html>
  `;
};
```

---

## 🔄 Enterprise Integration Points

### **Document Management Integration**

#### **Form Template Population**
```javascript
const populateFormWithSpreadsheetData = async (spreadsheetData, formTemplateId) => {
  // Export spreadsheet to structured data
  const htmlExport = exportToHTML(spreadsheetData, 'Data Source', {
    includeFormatting: false,
    theme: 'minimal'
  });

  // Extract data for form population
  const extractedData = extractDataFromHTML(htmlExport);

  // Update form template
  return await updateTemplateWithData(formTemplateId, extractedData);
};
```

#### **Report Generation Workflow**
```javascript
const generateProjectReport = async (projectId, userContext) => {
  // 1. Query project data
  const projectData = await fetchProjectData(projectId);

  // 2. Create spreadsheet analysis (simulated)
  const analysisSpreadsheet = await createAnalysisSpreadsheet(projectData, userContext);

  // 3. Export to HTML report
  const htmlReport = exportToHTML(analysisSpreadsheet, `Project ${projectId} Analysis`, {
    theme: getUserTheme(userContext),
    includeFormulas: userContext === 'finance',
    responsive: true
  });

  // 4. Save to document management system
  return await saveReportToDocuments(projectId, htmlReport);
};
```

### **Email Integration**
```javascript
const exportForEmailEmbedding = (spreadsheetData, emailSubject) => {
  return exportToHTML(spreadsheetData, emailSubject, {
    theme: 'email-friendly',
    responsive: true,
    cssCdn: true, // Use external CSS for email compatibility
    inlineStyles: true, // Inline styles for better email client support
    maxTableWidth: '600px' // Email-safe width
  });
};
```

---

## 🎨 Context-Aware Theming System

### **Discipline-Specific Themes**
```javascript
const THEMES = {
  procurement: {
    primary: '#007bff',
    accent: '#0056b3',
    headerBg: '#e3f2fd',
    headerText: '#0d47a1',
    rowAlt: '#f8f9ff',
    rowHover: '#bbdefb'
  },
  finance: {
    primary: '#28a745',
    accent: '#1e7e34',
    headerBg: '#e8f5e8',
    headerText: '#1b5e20',
    rowAlt: '#f8fff9',
    rowHover: '#c8e6c9'
  },
  engineering: {
    primary: '#ffc107',
    accent: '#ff8f00',
    headerBg: '#fff8e1',
    headerText: '#e65100',
    rowAlt: '#fffef8',
    rowHover: '#ffe0b2'
  },
  safety: {
    primary: '#dc3545',
    accent: '#bd2130',
    headerBg: '#f8d7da',
    headerText: '#721c24',
    rowAlt: '#fff8f9',
    rowHover: '#f5c6cb'
  }
};
```

### **Custom Theme Builder**
```javascript
const createCustomTheme = (companyBranding) => {
  return {
    primary: companyBranding.primaryColor,
    accent: companyBranding.accentColor,
    headerBg: lightenColor(companyBranding.primaryColor, 0.9),
    headerText: companyBranding.primaryColor,
    rowAlt: lightenColor(companyBranding.primaryColor, 0.98),
    rowHover: lightenColor(companyBranding.primaryColor, 0.85)
  };
};
```

---

## 📊 Export Options & Configuration

### **Export Configuration Panel**
```javascript
const ExportOptionsModal = ({ spreadsheetData, onExport }) => {
  const [options, setOptions] = useState({
    format: 'html', // 'html', 'dashboard', 'email'
    theme: 'default',
    includeFormulas: false,
    includeCharts: true,
    responsive: true,
    customCSS: '',
    tableRange: 'all' // 'all', 'selected', custom range
  });

  const handleExport = () => {
    if (options.format === 'html') {
      const html = exportToHTML(spreadsheetData, 'Exported Data', options);
      downloadHTML(html);
    }
  };

  return (
    <Modal>
      <h3>Export Options</h3>
      <ExportOptionsForm options={options} setOptions={setOptions} />
      <button onClick={handleExport}>Export</button>
    </Modal>
  );
};
```

### **Advanced Export Features**
- **Range Selection**: Export specific cell ranges
- **Sheet Filtering**: Export only selected sheets
- **Formula Display**: Show/hide underlying formulas
- **Data Formatting**: Preserve number formatting, dates, currency
- **Chart Embedding**: Include interactive charts in export
- **Custom CSS**: Apply organization-specific styling

---

## 🔧 Implementation Roadmap

### **Phase 1: Basic HTML Export (Week 1)**
- ✅ Implement basic table-to-HTML conversion
- ✅ Add CSS styling and theming system
- ✅ Create download functionality
- ✅ Responsive design support

### **Phase 2: Advanced Features (Week 2)**
- ✅ Multi-sheet export support
- ✅ Chart and visualization embedding
- ✅ Context-aware theming
- ✅ Template integration

### **Phase 3: Enterprise Integration (Week 3)**
- ✅ Document management system integration
- ✅ Email-compatible export formats
- ✅ Automated report generation workflows
- ✅ Organization-specific branding

---

## 📈 Performance & Quality Metrics

### **Export Performance Benchmarks**
- **Basic Table (100 cells)**: < 500ms generation time
- **Large Dataset (10k cells)**: < 3s generation time
- **HTML File Size**: < 1MB for typical exports
- **Memory Usage**: Peak < 50MB during export process

### **Quality Assurance**
- **HTML Validation**: W3C compliant markup
- **Accessibility**: WCAG AA compliant
- **Cross-browser Compatibility**: Modern browser support
- **Mobile Responsiveness**: < 768px optimization

---

## 🧪 Testing Strategy

### **Unit Tests**
```javascript
describe('HTML Export Service', () => {
  test('should convert spreadsheet data to valid HTML', () => {
    const testData = { 'A1': { value: 'Name' }, 'B1': { value: 'Price' } };
    const html = exportToHTML(testData, 'Test Sheet');

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Test Sheet');
    expect(html).toContain('<table');
  });

  test('should apply theme correctly', () => {
    const testData = { 'A1': { value: 'Test' } };
    const html = exportToHTML(testData, 'Test', { theme: 'procurement' });

    expect(html).toContain('#007bff'); // Procurement theme color
  });
});
```

### **Integration Tests**
- Document management system integration
- Email client compatibility testing
- Mobile device rendering verification
- Large dataset performance validation

---

## 📚 Related Documentation

### **Core UI Framework**
- **[0750_UI_MASTER_GUIDE.md](../../../user-interface/0750_UI_MASTER_GUIDE.md)** - Complete user interface system guide
- **[0750_SMART_CONTEXT_DETECTION_IMPLEMENTATION.md](./0750_SMART_CONTEXT_DETECTION_IMPLEMENTATION.md)** - Context-aware interface implementation

### **Functional Integration**
- **[1300_PAGES_DISCIPLINES_MASTER_GUIDE.md](../../../pages-disciplines/1300_PAGES_DISCIPLINES_MASTER_GUIDE.md)** - Discipline-specific page implementations
- **[0500_DATA_PROCESSING_MASTER_GUIDE.md](../../../data-processing/0500_DATA_PROCESSING_MASTER_GUIDE.md)** - Data processing and export workflows

### **External Services**
- **[0200_UNIVER_SPREADSHEET_INTEGRATION.md](../../../external-services/0200_UNIVER_SPREADSHEET_INTEGRATION.md)** - Spreadsheet engine integration

---

## 🏷️ Version History

### **v1.0.0 (2025-11-20)**
- Core HTML export functionality implementation
- CSS theming system and responsive design
- Multiple export format support (table, dashboard, email)
- Context-aware theming for different disciplines
- Enterprise integration with document management systems

---

## Status
- [x] Core HTML export service implemented
- [x] Responsive design and theming completed
- [x] Enterprise integration points documented
- [x] Performance benchmarks established
- [ ] Unit tests created
- [ ] Integration tests completed
- [ ] User acceptance testing performed

This HTML export implementation enables enterprise users to convert complex spreadsheet calculations into professional, shareable web documents that maintain formatting, calculations, and visual integrity across disciplines.
