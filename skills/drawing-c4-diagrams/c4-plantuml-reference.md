# C4-PlantUML Complete Reference

Comprehensive API reference for all C4-PlantUML macros, parameters, and features.

**Source:** [plantuml-stdlib/C4-PlantUML](https://github.com/plantuml-stdlib/C4-PlantUML)

## Parameter Conventions

- `arg` — required parameter
- `?arg` — optional parameter; set via keyword `$arg=...` (e.g. `$tags="myTag"`)
- All elements support: `?sprite`, `?tags`, `?link` as optional keyword arguments

## System Context & System Landscape (C4_Context)

```plantuml
!include <C4/C4_Context>
```

### Elements

| Macro | Parameters |
|---|---|
| `Person` | `(alias, label, ?descr, ?sprite, ?tags, ?link, ?type)` |
| `Person_Ext` | `(alias, label, ?descr, ?sprite, ?tags, ?link, ?type)` |
| `System` | `(alias, label, ?descr, ?sprite, ?tags, ?link, ?type, ?baseShape)` |
| `System_Ext` | `(alias, label, ?descr, ?sprite, ?tags, ?link, ?type, ?baseShape)` |
| `SystemDb` | `(alias, label, ?descr, ?sprite, ?tags, ?link, ?type)` |
| `SystemDb_Ext` | `(alias, label, ?descr, ?sprite, ?tags, ?link, ?type)` |
| `SystemQueue` | `(alias, label, ?descr, ?sprite, ?tags, ?link, ?type)` |
| `SystemQueue_Ext` | `(alias, label, ?descr, ?sprite, ?tags, ?link, ?type)` |

### Boundaries

| Macro | Parameters |
|---|---|
| `Boundary` | `(alias, label, ?type, ?tags, ?link, ?descr)` |
| `Enterprise_Boundary` | `(alias, label, ?tags, ?link, ?descr)` |
| `System_Boundary` | `(alias, label, ?tags, ?link, ?descr)` |

### Sprites

Built-in person/robot sprites: `person`, `person2`, `robot`, `robot2`

### Type Extension

`Person()` and `System()` support `$type` argument displayed as `[characteristic]`.

## Container Diagram (C4_Container)

```plantuml
!include <C4/C4_Container>
```

Inherits all System Context macros plus:

| Macro | Parameters |
|---|---|
| `Container` | `(alias, label, ?techn, ?descr, ?sprite, ?tags, ?link, ?baseShape)` |
| `Container_Ext` | `(alias, label, ?techn, ?descr, ?sprite, ?tags, ?link, ?baseShape)` |
| `ContainerDb` | `(alias, label, ?techn, ?descr, ?sprite, ?tags, ?link)` |
| `ContainerDb_Ext` | `(alias, label, ?techn, ?descr, ?sprite, ?tags, ?link)` |
| `ContainerQueue` | `(alias, label, ?techn, ?descr, ?sprite, ?tags, ?link)` |
| `ContainerQueue_Ext` | `(alias, label, ?techn, ?descr, ?sprite, ?tags, ?link)` |
| `Container_Boundary` | `(alias, label, ?tags, ?link, ?descr)` |

## Component Diagram (C4_Component)

```plantuml
!include <C4/C4_Component>
```

Inherits all Container macros plus:

| Macro | Parameters |
|---|---|
| `Component` | `(alias, label, ?techn, ?descr, ?sprite, ?tags, ?link, ?baseShape)` |
| `Component_Ext` | `(alias, label, ?techn, ?descr, ?sprite, ?tags, ?link, ?baseShape)` |
| `ComponentDb` | `(alias, label, ?techn, ?descr, ?sprite, ?tags, ?link)` |
| `ComponentDb_Ext` | `(alias, label, ?techn, ?descr, ?sprite, ?tags, ?link)` |
| `ComponentQueue` | `(alias, label, ?techn, ?descr, ?sprite, ?tags, ?link)` |
| `ComponentQueue_Ext` | `(alias, label, ?techn, ?descr, ?sprite, ?tags, ?link)` |

## Dynamic Diagram (C4_Dynamic)

```plantuml
!include <C4/C4_Dynamic>
```

Inherits all Component macros plus automatic step numbering.

### Index Macros

| Macro | Description |
|---|---|
| `Index($offset=1)` | Returns current index, increments next (function) |
| `SetIndex($new_index)` | Returns and sets new index (function) |
| `LastIndex()` | Returns last used index (function) |
| `increment($offset=1)` | Increment index (procedure, no output) |
| `setIndex($new_index)` | Set index (procedure, no output) |

All relationship macros support `?index` parameter: `Rel($from, $to, $label, $index="5")`.

## Deployment Diagram (C4_Deployment)

```plantuml
!include <C4/C4_Deployment>
```

Inherits Container macros plus:

| Macro | Parameters |
|---|---|
| `Deployment_Node` | `(alias, label, ?type, ?descr, ?sprite, ?tags, ?link)` |
| `Node` | `(alias, label, ?type, ?descr, ?sprite, ?tags, ?link)` |
| `Node_L` | `(alias, label, ?type, ?descr, ?sprite, ?tags, ?link)` |
| `Node_R` | `(alias, label, ?type, ?descr, ?sprite, ?tags, ?link)` |

`Node()` is a short alias for `Deployment_Node()`. `Node_L`/`Node_R` force left/right alignment.

Deployment nodes nest naturally:

```plantuml
Deployment_Node(aws, "AWS") {
    Deployment_Node(ecs, "ECS", "Container Service") {
        Container(api, "API", "Go")
    }
}
```

## Sequence Diagram (C4_Sequence)

```plantuml
!include <C4/C4_Sequence>
```

### Critical Differences from Other Diagram Types

1. **Boundaries use `Boundary_End()`** — NOT `{ }`
2. Element descriptions are hidden by default
3. Only `Rel()` is supported (no directional variants)

```plantuml
Container_Boundary(api, "API Application")
    Component(ctrl, "Controller", "REST")
    Component(svc, "Service", "Spring Bean")
Boundary_End()
```

### Additional Macros

| Macro | Description |
|---|---|
| `Boundary_End()` | Close a boundary block |
| `SHOW_ELEMENT_DESCRIPTIONS(?show)` | Toggle element descriptions |
| `SHOW_FOOT_BOXES(?show)` | Toggle foot boxes |
| `SHOW_INDEX(?show)` | Toggle index numbers |

### Relationship

```
Rel($from, $to, $label, $techn="", $descr="", $sprite="", $tags="", $link="", $index="", $rel="")
```

`$rel` allows PlantUML arrow customization (e.g. `->`, `-->`, `->>`, `-->`).

### Supported PlantUML Sequence Features

- [Grouping messages](https://plantuml.com/sequence-diagram#425ba4350c02142c) (`alt`, `else`, `opt`, `loop`, etc.)
- [Dividers](https://plantuml.com/sequence-diagram#d4b2df53a72661cc) (`== Section ==`)
- [References](https://plantuml.com/sequence-diagram#63d5049791d9d79d) (`ref over`)
- [Delays](https://plantuml.com/sequence-diagram#8f497c1a3d15af9e) (`...delay...`)

## Relationships (All Diagrams)

### Core

| Macro | Parameters |
|---|---|
| `Rel` | `(from, to, label, ?techn, ?descr, ?sprite, ?tags, ?link)` |
| `BiRel` | `(from, to, label, ?techn, ?descr, ?sprite, ?tags, ?link)` |

### Directional

| Macro | Direction |
|---|---|
| `Rel_U` / `Rel_Up` | Force upward |
| `Rel_D` / `Rel_Down` | Force downward |
| `Rel_L` / `Rel_Left` | Force left |
| `Rel_R` / `Rel_Right` | Force right |
| `Rel_Back` | Reverse arrow |
| `Rel_Neighbor` | Place adjacent |
| `Rel_Back_Neighbor` | Reverse + adjacent |

BiRel also supports: `BiRel_U`, `BiRel_D`, `BiRel_L`, `BiRel_R`.

## Layout Macros

### Global

| Macro | Effect |
|---|---|
| `LAYOUT_TOP_DOWN()` | Default top-to-bottom flow |
| `LAYOUT_LEFT_RIGHT()` | Left-to-right flow |
| `LAYOUT_LANDSCAPE()` | Landscape orientation |
| `LAYOUT_WITH_LEGEND()` | Auto legend at bottom-right |
| `LAYOUT_AS_SKETCH()` | Hand-drawn sketch style |
| `SHOW_LEGEND(?hideStereotype, ?details)` | Show calculated legend (must be last line) |
| `SHOW_FLOATING_LEGEND(?alias, ?hideStereotype, ?details)` | Positionable floating legend |
| `HIDE_STEREOTYPE()` | Hide stereotype labels |
| `HIDE_PERSON_SPRITE()` | Hide person icon |
| `SHOW_PERSON_SPRITE(?sprite)` | Show specific person sprite |
| `SHOW_PERSON_PORTRAIT()` | Show portrait-style person |
| `SHOW_PERSON_OUTLINE()` | Show outline-style person (PlantUML >= 1.2021.4) |

### Element Arrangement (No Relationships)

| Macro | Description |
|---|---|
| `Lay_U(from, to)` / `Lay_Up` | Place from above to |
| `Lay_D(from, to)` / `Lay_Down` | Place from below to |
| `Lay_L(from, to)` / `Lay_Left` | Place from left of to |
| `Lay_R(from, to)` / `Lay_Right` | Place from right of to |
| `Lay_Distance(from, to, ?distance)` | Set distance between elements |

## Tags and Stereotypes

### Add Tag Definitions

| Macro | Parameters |
|---|---|
| `AddElementTag` | `(tagStereo, ?bgColor, ?fontColor, ?borderColor, ?shadowing, ?shape, ?sprite, ?techn, ?legendText, ?legendSprite, ?borderStyle, ?borderThickness)` |
| `AddRelTag` | `(tagStereo, ?textColor, ?lineColor, ?lineStyle, ?sprite, ?techn, ?legendText, ?legendSprite, ?lineThickness)` |
| `AddBoundaryTag` | `(tagStereo, ?bgColor, ?fontColor, ?borderColor, ?shadowing, ?shape, ?type, ?legendText, ?borderStyle, ?borderThickness, ?sprite, ?legendSprite)` |

### Element-Specific Tag Shortcuts

These use element-specific default colors:

| Macro | Element |
|---|---|
| `AddPersonTag(...)` | Person |
| `AddExternalPersonTag(...)` | Person_Ext |
| `AddSystemTag(...)` | System |
| `AddExternalSystemTag(...)` | System_Ext |
| `AddContainerTag(...)` | Container |
| `AddExternalContainerTag(...)` | Container_Ext |
| `AddComponentTag(...)` | Component |
| `AddExternalComponentTag(...)` | Component_Ext |
| `AddNodeTag(...)` | Deployment_Node |

### Update Default Styles

| Macro | Description |
|---|---|
| `UpdateElementStyle(elementName, ...)` | Modify default element style |
| `UpdateRelStyle(textColor, lineColor)` | Modify default relationship colors |
| `UpdateBoundaryStyle(...)` | Modify default boundary style |
| `UpdateContainerBoundaryStyle(...)` | Modify container boundary style |
| `UpdateSystemBoundaryStyle(...)` | Modify system boundary style |
| `UpdateEnterpriseBoundaryStyle(...)` | Modify enterprise boundary style |
| `UpdateLegendTitle(newTitle)` | Change legend title text |

### Using Tags

```plantuml
' Single tag
Container(svc, "Service", "Go", "API", $tags="microservice")

' Multiple tags (combine with +)
Container(api, "API", "Java", "Legacy API", $tags="v1+legacy")
```

### Tag Rules

- No spaces around `=` in `$tags="..."`
- No commas in tag names
- If two tags define the same skinparam, first definition wins
- Combined tag styles (e.g. `"tag1&tag2"`) must be defined explicitly for merged colors
- `SHOW_LEGEND()` is required to display tags in legend

### Shape Options

| Function | Shape |
|---|---|
| `SharpCornerShape()` | Rectangle with sharp corners (default) |
| `RoundedBoxShape()` | Rectangle with rounded corners |
| `EightSidedShape()` | Octagon |

### Line Style Options

| Function | Style |
|---|---|
| `DashedLine()` | Dashed line |
| `DottedLine()` | Dotted line |
| `BoldLine()` | Bold line |
| `SolidLine()` | Solid line (default/reset) |

## Properties

Add structured data tables to elements and relationships.

| Macro | Description |
|---|---|
| `SetPropertyHeader(col1, ?col2, ?col3, ?col4)` | Set column headers (max 4). Default: "Name", "Description" |
| `WithoutPropertyHeader()` | Suppress header; second column becomes bold |
| `AddProperty(col1, ?col2, ?col3, ?col4)` | Add a property row to the **next** element or relationship |

```plantuml
SetPropertyHeader("Property", "Value")
AddProperty("Deployment", "Kubernetes")
AddProperty("Replicas", "3")
Container(api, "API", "Go", "Core API with properties")
```

## Sprites and Images

### Built-in

`person`, `person2`, `robot`, `robot2`

### External Sprite Libraries

```plantuml
!define DEVICONS https://raw.githubusercontent.com/tupadr3/plantuml-icon-font-sprites/master/devicons
!define FONTAWESOME https://raw.githubusercontent.com/tupadr3/plantuml-icon-font-sprites/master/font-awesome-5
!include DEVICONS/angular.puml
!include FONTAWESOME/users.puml
```

### Image Options

| Format | Example |
|---|---|
| Stdlib sprite | `$sprite="person2"` |
| Image URL | `$sprite="img:https://example.com/icon.png"` |
| OpenIconic | `$sprite="&folder"` |
| Scaled | `$sprite="person2,scale=0.5"` |
| Colored | `$sprite="person2,color=red"` |

## Version Information

| Macro | Description |
|---|---|
| `C4Version()` | Current C4-PlantUML version string |
| `C4VersionDetails()` | Floating table with PlantUML + C4 versions |

## Comprehensive Example — Internet Banking System

### System Context (L1)

```plantuml
@startuml System_Context_BigBank
!include <C4/C4_Context>

LAYOUT_WITH_LEGEND()

title System Context diagram for Internet Banking System

Person(customer, "Personal Banking Customer", "A customer of the bank, with personal bank accounts.")
System(banking_system, "Internet Banking System", "Allows customers to view information about their bank accounts, and make payments.")

System_Ext(mail_system, "E-mail system", "The internal Microsoft Exchange e-mail system.")
System_Ext(mainframe, "Mainframe Banking System", "Stores all of the core banking information about customers, accounts, transactions, etc.")

Rel(customer, banking_system, "Uses")
Rel_Back(customer, mail_system, "Sends e-mails to")
Rel_Neighbor(banking_system, mail_system, "Sends e-mails", "SMTP")
Rel(banking_system, mainframe, "Uses")
@enduml
```

### Container (L2)

```plantuml
@startuml Container_BigBank
!include <C4/C4_Container>

LAYOUT_WITH_LEGEND()

title Container diagram for Internet Banking System

Person(customer, "Customer", "A customer of the bank, with personal bank accounts")

System_Boundary(c1, "Internet Banking") {
    Container(web_app, "Web Application", "Java, Spring MVC", "Delivers the static content and the Internet banking SPA")
    Container(spa, "Single-Page App", "JavaScript, Angular", "Provides all the Internet banking functionality to customers via their web browser")
    Container(mobile_app, "Mobile App", "C#, Xamarin", "Provides a limited subset of the Internet banking functionality to customers via their mobile device")
    ContainerDb(database, "Database", "SQL Database", "Stores user registration information, hashed auth credentials, access logs, etc.")
    Container(backend_api, "API Application", "Java, Docker Container", "Provides Internet banking functionality via API")
}

System_Ext(email_system, "E-Mail System", "The internal Microsoft Exchange system")
System_Ext(banking_system, "Mainframe Banking System", "Stores all of the core banking information about customers, accounts, transactions, etc.")

Rel(customer, web_app, "Uses", "HTTPS")
Rel(customer, spa, "Uses", "HTTPS")
Rel(customer, mobile_app, "Uses")

Rel_Neighbor(web_app, spa, "Delivers")
Rel(spa, backend_api, "Uses", "async, JSON/HTTPS")
Rel(mobile_app, backend_api, "Uses", "async, JSON/HTTPS")
Rel_Back_Neighbor(database, backend_api, "Reads from and writes to", "sync, JDBC")

Rel_Back(customer, email_system, "Sends e-mails to")
Rel_Back(email_system, backend_api, "Sends e-mails using", "sync, SMTP")
Rel_Neighbor(backend_api, banking_system, "Uses", "sync/async, XML/HTTPS")
@enduml
```

### Component (L3)

```plantuml
@startuml Component_BigBank
!include <C4/C4_Component>

LAYOUT_WITH_LEGEND()

title Component diagram for Internet Banking System - API Application

Container(spa, "Single Page Application", "JavaScript and Angular", "Provides all the internet banking functionality to customers via their web browser.")
Container(ma, "Mobile App", "Xamarin", "Provides a limited subset of the internet banking functionality to customers via their mobile device.")
ContainerDb(db, "Database", "Relational Database Schema", "Stores user registration information, hashed authentication credentials, access logs, etc.")
System_Ext(mbs, "Mainframe Banking System", "Stores all of the core banking information about customers, accounts, transactions, etc.")

Container_Boundary(api, "API Application") {
    Component(sign, "Sign In Controller", "MVC Rest Controller", "Allows users to sign in to the internet banking system")
    Component(accounts, "Accounts Summary Controller", "MVC Rest Controller", "Provides customers with a summary of their bank accounts")
    Component(security, "Security Component", "Spring Bean", "Provides functionality related to signing in, changing passwords, etc.")
    Component(mbsfacade, "Mainframe Banking System Facade", "Spring Bean", "A facade onto the mainframe banking system.")
}

Rel(spa, sign, "Uses", "JSON/HTTPS")
Rel(spa, accounts, "Uses", "JSON/HTTPS")
Rel(ma, sign, "Uses", "JSON/HTTPS")
Rel(ma, accounts, "Uses", "JSON/HTTPS")

Rel(sign, security, "Uses")
Rel(accounts, mbsfacade, "Uses")
Rel(security, db, "Read & write to", "JDBC")
Rel(mbsfacade, mbs, "Uses", "XML/HTTPS")

@enduml
```

### Deployment

```plantuml
@startuml Deployment_BigBank
!include <C4/C4_Deployment>

AddElementTag("fallback", $bgColor="#c0c0c0")
AddRelTag("fallback", $textColor="#c0c0c0", $lineColor="#438DD5")

title Deployment Diagram for Internet Banking System - Live

Deployment_Node(plc, "Big Bank plc", "Big Bank plc data center") {
    Deployment_Node(dn, "bigbank-api x8", "Ubuntu 16.04 LTS") {
        Deployment_Node(apache, "Apache Tomcat", "Apache Tomcat 8.x") {
            Container(api, "API Application", "Java and Spring MVC", "Provides Internet Banking functionality via a JSON/HTTPS API.")
        }
    }
    Deployment_Node(bigbankdb01, "bigbank-db01", "Ubuntu 16.04 LTS") {
        Deployment_Node(oracle, "Oracle - Primary", "Oracle 12c") {
            ContainerDb(db, "Database", "Relational Database Schema", "Stores user registration information, hashed authentication credentials, access logs, etc.")
        }
    }
    Deployment_Node(bigbankdb02, "bigbank-db02", "Ubuntu 16.04 LTS", $tags="fallback") {
        Deployment_Node(oracle2, "Oracle - Secondary", "Oracle 12c", $tags="fallback") {
            ContainerDb(db2, "Database", "Relational Database Schema", "Stores user registration information, hashed authentication credentials, access logs, etc.", $tags="fallback")
        }
    }
    Deployment_Node(bb2, "bigbank-web x4", "Ubuntu 16.04 LTS") {
        Deployment_Node(apache2, "Apache Tomcat", "Apache Tomcat 8.x") {
            Container(web, "Web Application", "Java and Spring MVC", "Delivers the static content and the Internet Banking single page application.")
        }
    }
}

Deployment_Node(mob, "Customer's mobile device", "Apple iOS or Android") {
    Container(mobile, "Mobile App", "Xamarin", "Provides a limited subset of the Internet Banking functionality to customers via their mobile device.")
}

Deployment_Node(comp, "Customer's computer", "Microsoft Windows or Apple macOS") {
    Deployment_Node(browser, "Web Browser", "Chrome, Firefox, Safari, or Edge") {
        Container(spa, "Single Page Application", "JavaScript and Angular", "Provides all of the Internet Banking functionality to customers via their web browser.")
    }
}

Rel(mobile, api, "Makes API calls to", "JSON/HTTPS")
Rel(spa, api, "Makes API calls to", "JSON/HTTPS")
Rel_U(web, spa, "Delivers to the customer's web browser")
Rel(api, db, "Reads from and writes to", "JDBC")
Rel(api, db2, "Reads from and writes to", "JDBC", $tags="fallback")
Rel_R(db, db2, "Replicates data to")

SHOW_LEGEND()
@enduml
```

### Dynamic

```plantuml
@startuml Dynamic_BigBank
!include <C4/C4_Dynamic>

LAYOUT_WITH_LEGEND()

ContainerDb(c4, "Database", "Relational Database Schema", "Stores user registration information, hashed authentication credentials, access logs, etc.")
Container(c1, "Single-Page Application", "JavaScript and Angular", "Provides all of the Internet banking functionality to customers via their web browser.")

Container_Boundary(b, "API Application") {
    Component(c3, "Security Component", "Spring Bean", "Provides functionality related to signing in, changing passwords, etc.")
    Component(c2, "Sign In Controller", "Spring MVC Rest Controller", "Allows users to sign in to the Internet Banking System.")
}

Rel_R(c1, c2, "Submits credentials to", "JSON/HTTPS")
Rel(c2, c3, "Calls isAuthenticated() on")
Rel_R(c3, c4, "select * from users where username = ?", "JDBC")
@enduml
```

### Sequence

```plantuml
@startuml Sequence_BigBank
!include <C4/C4_Sequence>

Container(c1, "Single-Page Application", "JavaScript and Angular", "Provides all of the Internet banking functionality to customers via their web browser.")

Container_Boundary(b, "API Application")
    Component(c2, "Sign In Controller", "Spring MVC Rest Controller", "Allows users to sign in to the Internet Banking System.")
    Component(c3, "Security Component", "Spring Bean", "Provides functionality related to signing in, changing passwords, etc.")
Boundary_End()

ContainerDb(c4, "Database", "Relational Database Schema", "Stores user registration information, hashed authentication credentials, access logs, etc.")

Rel(c1, c2, "Submits credentials to", "JSON/HTTPS")
Rel(c2, c3, "Calls isAuthenticated() on")
Rel(c3, c4, "select * from users where username = ?", "JDBC")

SHOW_LEGEND()
@enduml
```
