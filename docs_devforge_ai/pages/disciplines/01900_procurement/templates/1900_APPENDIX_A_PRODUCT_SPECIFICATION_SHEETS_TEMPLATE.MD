# APPENDIX A: PRODUCT SPECIFICATION SHEETS FORM TEMPLATE
## HTML Form Description for Lubricant Product Specifications

This document describes the HTML form structure that would depict the APPENDIX A: PRODUCT SPECIFICATION SHEETS document. The form is organized by main sections with titles, headings, and narrative explanations for each field's expected content.

## Form Structure: Product Specification Sheets

### Main Sections
1. **General Requirements Section**
2. **Product Categories Section** (with sub-forms for each lubricant type)
3. **Quality Assurance Section**
4. **Storage & Handling Section**
5. **Document Metadata Section**

---

### 1. General Requirements

#### Scope Field
**Field Type:** Textarea
**Field Name:** General Scope
**Narrative:** A text area where users describe the overall scope of the product specifications document, explaining what products are covered and the purpose of the specifications.

#### Compliance Standards Field
**Field Type:** Multi-select checkboxes with text inputs
**Field Name:** Compliance Standards
**Narrative:** A set of checkboxes for selecting international standards organizations (API, SAE, ISO, OEM, REACH) with optional text fields to specify particular classifications or versions that the products must meet.

---

### 2. Product Categories

#### Product Type Selection
**Field Type:** Dropdown select
**Field Name:** Lubricant Product Type
**Narrative:** A dropdown menu allowing selection between major lubricant categories: Engine Oils, Hydraulic Oils, Gear Oils, or Greases. This selection determines which sub-form appears below.

#### Sub-Form: Engine Oils Specifications
This form appears when "Engine Oils" is selected, with fields for both Heavy Duty Diesel and Passenger Car variants.

##### Product Code Field
**Field Type:** Text input
**Field Name:** Product Identification Code
**Narrative:** A unique alphanumeric code field for identifying the specific engine oil product, typically following a format that indicates the product type and grade.

##### Viscosity Grade Field
**Field Type:** Dropdown select
**Field Name:** SAE Viscosity Classification
**Narrative:** Drop down containing SAE viscosity grades (e.g., 15W-40, 5W-30) that define the oil's flow characteristics under different temperature conditions.

##### API Classification Field
**Field Type:** Text input
**Field Name:** API Service Category
**Narrative:** Text field for entering the American Petroleum Institute classification that specifies the engine oil's performance level and compatibility with different engine types.

##### Base Oil Type Field
**Field Type:** Radio buttons
**Field Name:** Oil Base Composition
**Narrative:** Radio button selection between Mineral Oil, Synthetic Blend, or Full Synthetic to indicate the fundamental composition of the base oil.

##### Technical Specifications Group
**Field Type:** Number inputs table/grid
**Field Name:** Viscosity and Performance Parameters
**Narrative:** A grid of labeled number input fields capturing critical physical properties including viscosity measurements at different temperatures, viscosity index, flash point, pour point, and chemical characteristics.

##### Performance Features Field
**Field Type:** Multi-select checkboxes
**Field Name:** Key Performance Characteristics
**Narrative:** Checkboxes for selecting various performance benefits such as extended drain intervals, fuel efficiency, temperature stability, and protection features that distinguish the product's capabilities.

##### Packaging Options Field
**Field Type:** Multi-select checkboxes
**Field Name:** Available Container Types
**Narrative:** Checkboxes allowing selection of multiple packaging formats ranging from small consumer containers to bulk industrial quantities, depending on the intended distribution channel.

#### Sub-Form: Hydraulic Oils Specifications
Similar structure to Engine Oils but tailored to hydraulic fluid properties.

##### Product Code Field
**Field Type:** Text input
**Field Name:** Product Identification Code
**Narrative:** Unique code identifying the hydraulic oil variant and viscosity grade.

##### Viscosity Grade Field
**Field Type:** Dropdown select
**Field Name:** ISO Viscosity Grade
**Narrative:** ISO VG classification (e.g., VG 46, VG 68) defining the oil's viscosity at 40°C.

##### Performance Level Field
**Field Type:** Text input
**Field Name:** Industry Standard Classification
**Narrative:** Field for entering standards like DIN 51524 classifications that define the hydraulic oil's performance requirements.

##### Technical Specifications Group
**Field Type:** Number inputs table
**Field Name:** Hydraulic Performance Parameters
**Narrative:** Number fields for viscosity at different temperatures, viscosity index, air release properties, foam stability, and other hydraulic-specific performance metrics.

##### Performance Features Field
**Field Type:** Multi-select checkboxes
**Field Name:** Operating Characteristics
**Narrative:** Selection of properties like anti-wear protection, oxidation stability, and temperature performance specific to hydraulic systems.

##### Packaging Options Field
**Same as Engine Oils** - Multi-select checkboxes for industrial packaging types.

#### Sub-Form: Gear Oils Specifications
Similar structure with gear-specific parameters.

##### Product Code Field
**Field Type:** Text input
**Field Name:** Product Identification Code
**Narrative:** Code identifying whether it's automotive or industrial gear oil and its viscosity grade.

##### Viscosity Grade Field
**Field Type:** Dropdown select
**Field Name:** Viscosity Classification
**Narrative:** SAE grades for automotive or ISO VG for industrial applications defining the operating temperature range.

##### API Classification Field
**Field Type:** Text input
**Field Name:** Gear Oil Service Category
**Narrative:** API GL classification for automotive gears or performance level for industrial gears.

##### Technical Specifications Group
**Field Type:** Number inputs table
**Field Name:** Gear Performance Parameters
**Narrative:** Fields for viscosity measurements, corrosion resistance, extreme pressure test results, and other gear-specific requirements.

##### Performance Features Field
**Field Type:** Multi-select checkboxes
**Field Name:** Application Benefits
**Narrative:** Selection of features like shock load resistance, thermal stability, and compatibility with synchronizers.

##### Packaging Options Field
**Same structure as above.**

#### Sub-Form: Greases Specifications
Similar structure adapted for grease products.

##### Product Code Field
**Field Type:** Text input
**Field Name:** Product Identification Code
**Narrative:** Code identifying the grease type and NLGI grade.

##### NLGI Grade Field
**Field Type:** Dropdown select
**Field Name:** Consistency Classification
**Narrative:** NLGI grade number (0-6) indicating the grease's stiffness or consistency.

##### Thickener Type Field
**Field Type:** Text input
**Field Name:** Thickening Agent
**Narrative:** Description of the thickener chemistry such as lithium complex, polyurea, or calcium sulfonate.

##### Technical Specifications Group
**Field Type:** Number inputs table
**Field Name:** Grease Performance Parameters
**Narrative:** Fields for penetration values, dropping point, oil separation rate, and other grease-specific test results.

##### Performance Features Field
**Field Type:** Multi-select checkboxes
**Field Name:** Application Properties
**Narrative:** Selection of characteristics like temperature range, water resistance, and mechanical stability.

##### Packaging Options Field
**Field Type:** Multi-select checkboxes
**Field Name:** Grease Packaging Formats
**Narrative:** Checkboxes for grease-specific containers like cartridges, tins, pails, and drums.

---

### 3. Quality Assurance

#### Certificate Requirements Field
**Field Type:** Multi-select checkboxes
**Field Name:** Required Documentation
**Narrative:** Checkboxes for mandatory documentation that must accompany each batch, including analysis certificates, test results, and compliance verification.

#### Testing Requirements Field
**Field Type:** Nested checkboxes
**Field Name:** Quality Control Procedures
**Narrative:** Two-level checkboxes separating supplier testing (raw materials, in-process, finished product) from independent third-party verification requirements.

#### Independent Testing Field
**Field Type:** Multi-select checkboxes
**Field Name:** External Verification Processes
**Narrative:** Selection of third-party validation methods including laboratory testing, OEM approvals, and field performance monitoring.

---

### 4. Storage & Handling

#### Storage Conditions Field
**Field Type:** Number inputs with units
**Field Name:** Environmental Requirements
**Narrative:** Numeric fields for temperature range (min/max), humidity limit, and storage environment requirements.

#### Shelf Life Field
**Field Type:** Number inputs
**Field Name:** Product Stability Duration
**Narrative:** Fields showing anticipated shelf life in years or months for different product categories under proper storage conditions.

#### Handling Requirements Field
**Field Type:** Multi-select checkboxes
**Field Name:** Safety and Operational Procedures
**Narrative:** Checkboxes for required protective equipment, contamination prevention, lifting equipment, and emergency response measures.

---

### 5. Document Metadata

#### Document Reference Field
**Field Type:** Text input
**Field Name:** Document Identifier
**Narrative:** Field for entering the unique document reference code following the organization's naming convention.

#### Purchase Order Field
**Field Type:** Text input
**Field Name:** Associated Purchase Order
**Narrative:** Reference to the purchase order number this specification sheet is attached to.

#### Revision Information Field
**Field Type:** Date picker + text input
**Field Name:** Version Control
**Narrative:** Date field for last revision and text field for version number or change description.

#### Prepared By Field
**Field Type:** Text input
**Field Name:** Author Department
**Narrative:** Text field identifying the department or individual responsible for creating and maintaining the specification sheet.

---

**Document Reference:** 01900_APP_A_PRODUCT_SPECS_TEMPLATE_V1.0
**Template Purpose:** HTML Form Generation Template
**Revision Date:** November 2025
**Prepared By:** Technical Documentation Department

---

This form structure provides a comprehensive template for entering lubricant product specifications with appropriate field types, validation requirements, and user guidance through narrative explanations for each input. The form is designed to be converted into an HTML template with proper input types, validation rules, and responsive layout.
