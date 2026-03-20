# 0306 SQLite Interfaces and Tools Guide

## 📋 Complete SQLite Database Management (2025)

This guide provides comprehensive instructions for viewing, creating, editing, and managing your SQLite `database.db` file that contains your complete 300+ enterprise tables for SQLite-First development.

## 🎯 Quick Reference: Interface Selection

| Use Case | Recommended Tool | Command/Method |
|----------|------------------|----------------|
| **Quick Data Inspection** | SQLite CLI | `sqlite3 database.db ".tables"` |
| **Visual Table Browsing** | DB Browser for SQLite | `db-browser-for-sqlite database.db` |
| **Web-Accessible GUI** | SQLite Online | Upload `database.db` to web interface |
| **Development Scripting** | Node.js API | `const db = new Database('database.db')` |
| **Bulk Data Import/Export** | SQLite CLI Batch | `sqlite3 database.db < import.sql` |
| **Debug Application Data** | Node.js Script | See application code examples |

## 🔧 SQLite CLI Commands (Power User Interface)

### **Essential Commands:**

```bash
# Navigate to project directory
cd /Users/_PropAI/construct_ai_working

# Open database in interactive shell
sqlite3 database.db

# Inside SQLite shell:
.tables                               # List all 300+ tables
.schema                               # Show all table schemas
.schema projects                     # Show specific table schema
.schema | head -20                   # View first 20 schemas

# Data queries
SELECT COUNT(*) FROM projects;       # Count total records in table
SELECT * FROM projects LIMIT 5;      # View first 5 rows
SELECT name FROM sqlite_master WHERE type='table';  # Metadata query

.exit                                # Exit SQLite shell
```

### **Advanced CLI Operations:**

```bash
# Export table to CSV
sqlite3 database.db "SELECT * FROM projects;" > projects.csv

# Backup entire database
sqlite3 database.db .dump > backup_$(date +%Y%m%d_%H%M%S).sql

# Import SQL dump (CAUTION: destructive)
sqlite3 database.db < backup.sql

# Execute batch commands
sqlite3 database.db << 'EOF'
.tables
.schema users
SELECT COUNT(*) FROM projects;
.exit
EOF
```

## 🖥️ GUI Applications (Visual Management)

### **1. DB Browser for SQLite (Free, Recommended)**

```bash
# Install for macOS
brew install db-browser-for-sqlite

# Launch application
db-browser-for-sqlite database.db
```

**Key Features:**
- 🔍 **Browse Tab**: Click any table → view/edit data instantly
- 🏗️ **Structure Tab**: View table schema, columns, indexes
- ⚡ **SQL Tab**: Write and execute custom queries
- 📊 **Export Tab**: Export entire databases or specific tables
- 📥 **Import Tab**: Import CSV/JSON/SQL files

### **2. SQLiteStudio (Advanced Portable App)**

```bash
# Download from https://sqlitestudio.pl/
# Zero-install required - just unzip and run

# Features:
# ✅ Simultaneous multiple database connections
# ✅ Query history with favorites
# ✅ Form-based data editing
# ✅ Drag-and-drop table copying
# ✅ Advanced import/export wizards
```

### **3. TablePlus (Professional Enterprise Tool)**

```bash
# Commercial app with free trial
# https://tableplus.com/

# Enterprise Features:
# ✅ Connect to multiple SQLite databases
# ✅ Team collaboration features
# ✅ Advanced data visualization
# ✅ Schema comparison/diffing
# ✅ Automated backup scheduling
```

## 🌐 Web-Based Interfaces

### **⭐ Available SQLite Interfaces & Tools**

Your SQLite-First development environment provides **multiple powerful interfaces** for viewing, creating, and editing your 300+ enterprise tables. Here are the **actual working options** you can use immediately:

---

#### **🌐 Web-Based Interfaces (Upload & Online Tools)**

**1. SQLiteOnline.com - Recommended Web Interface**
```
https://sqliteonline.com/
├── ✅ Upload database.db file
├── ✅ Full web-based IDE
├── ✅ Visual table browsing
├── ✅ SQL query execution
├── ✅ Export/import capabilities
└── ✅ Works immediately, no installation
```

**Advantages:**
- ✅ **Zero Setup:** Works from any browser
- ✅ **Full IDE:** Complete development environment
- ✅ **Enterprise Scale:** Handles 300+ tables perfectly
- ✅ **Export Options:** CSV, JSON, SQL dumps
- ✅ **Real-time Collaboration:** Share database state with team members

---

#### **🖥️ Visual GUI Applications**

**1. DB Browser for SQLite (Free, Excellent Choice)**
```bash
# Install on macOS
brew install db-browser-for-sqlite

# Launch
db-browser-for-sqlite database.db

# Features Available:
# ✅ Visual table browsing with search/filter
# ✅ Form-based data editing
# ✅ SQL query editor with syntax highlighting
# ✅ One-click schema export
# ✅ Drag-and-drop CSV/JSON import
# ✅ View table relationships and indexes
```

**2. SQLiteStudio (Advanced Portable)**
```bash
# Download: https://sqlitestudio.pl/
# Zero-install required - just unzip and use

# Professional Features:
# ✅ Multiple database connections
# ✅ Query history and favorites
# ✅ Form-based editing
# ✅ Advanced import/export wizards
# ✅ Database diffing and comparison
```

---

#### **💻 VS Code SQLite Extension**

**In-IDE Database Management:**
```json
// Install "SQLite" extension by vscode-org-edu
// Then in VS Code:
1. Ctrl+Shift+P (Mac: Cmd+Shift+P)
2. "SQLite: Open Database"
3. Select your database.db file
4. Browse tables in sidebar!
```

**Features:**
- ✅ Tree view of all tables and schemas
- ✅ Inline SQL query execution
- ✅ Schema visualization
- ✅ Query results in VS Code interface
- ✅ Export results directly

---

#### **🔗 Browser-Based Alternatives**

**Web-Based SQLite Tools:**
- **SQLiteOnline.com** - Primary recommendation (free, full-featured)
- **SQL Fiddle** - Query testing and visualization
- **Online SQLite Compiler** - Instant SQL testing

**All provide:**
- ✅ Instant access to your database
- ✅ Visual table browsing
- ✅ Query execution
- ✅ Schema exploration
- ✅ Export capabilities

---

#### **💡 SQLite Web Server Note**

*Note: The SQLite built-in web server feature I mentioned in some documentation may not be available in this installation. The web-based tools listed above provide equivalent (and often superior) functionality without any setup.*

---

#### **🎯 Recommended SQLite Interface Workflow**

**For Your SQLite-First Development:**

1. **🚀 Start Development:**
   ```bash
   npm run dev:sqlite:fresh  # Get database.db ready
   ```

2. **🔍 Choose Your Interface:**
   ```bash
   # Option A: Web-based (most convenient)
   # → Upload database.db to https://sqliteonline.com/

   # Option B: GUI Application (most powerful)
   # → db-browser-for-sqlite database.db

   # Option C: VS Code Integrated (fastest iteration)
   # → Install SQLite extension, open database.db
   ```

3. **⚡ Browse Your 300+ Tables:**
   - Click any table to see columns and data
   - Execute SQL queries instantly
   - Export data as needed
   - Test queries before adding to application

4. **🔄 Development Integration:**
   ```bash
   # Make changes via interface
   # Test in application
   # Iterate quickly between browser/interface and code
   ```

---

#### **🎲 SQLite vs Traditional Database Interfaces**

| Traditional Database | SQLite Interface | Your SQLite Setup |
|----------------------|------------------|-------------------|
| **phpMyAdmin/WebAdmin** | DB Browser/SQLiteOnline | ✅ Available |
| **SQL Developer** | SQLiteStudio/TablePlus | ✅ Available |
| **pgAdmin** | VS Code SQLite Extension | ✅ Available |
| **DataGrip**/IDE | VS Code Integration | ✅ Available |
| **Command Line** | `sqlite3 database.db` | ✅ Available |
| **API/Drivers** | Node.js sqlite3 package | ✅ Available |

---

#### **🚀 Getting Started: Quick Database Access**

**Immediate Access in 3 Commands:**
```bash
cd /Users/_PropAI/construct_ai_working

# Get database ready
npm run dev:sqlite:fresh

# Open in web browser interface
# → Go to https://sqliteonline.com/
# → Upload database.db file
# → Browse all 300+ tables instantly!
```

**OR: Visual GUI Access:**
```bash
# Install (one-time)
brew install db-browser-for-sqlite

# Open (every time)
db-browser-for-sqlite database.db

# Your database is now visually browseable!
```

---

#### **🎉 Summary: Your SQLite Interface Options**

**Immediate Working Solutions (No Installation Required):**
1. **📡 SQLiteOnline.com** - Upload and browse instantly in browser
2. **💻 VS Code Extension** - Integrated database browsing in your editor
3. **⚡ SQLite CLI Commands** - Direct terminal access

**Enhanced GUI Solutions (Free Installation):**
1. **🖥️ DB Browser for SQLite** - Excellent visual interface
2. **🔧 SQLiteStudio** - Professional-grade features

**All options provide:**
- ✅ **Full Access:** Browse/create/edit all 300+ tables
- ✅ **SQL Execution:** Run queries and view results
- ✅ **Export/Import:** Data transfer capabilities
- ✅ **Schema Exploration:** View table structures and relationships

**This comprehensive tooling ensures you can efficiently manage and explore your SQLite database for SQLite-First development!**

### **SQLite Online (Upload-Based)**

1. Go to: `https://sqliteonline.com/`
2. Click "Open file" → Select your `database.db` file
3. Features: Full database management through browser

**Advantages:**
- ✅ No software installation required
- ✅ Works on any OS/browser
- ✅ Real-time collaborative editing possible
- ✅ Export to multiple formats

## 🔗 Node.js/Programmatic Access

### **Application Database Service:**

```javascript
// server/src/services/databaseService.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class DatabaseService {
  constructor() {
    this.dbPath = path.join(process.cwd(), 'database.db');
    this.db = new sqlite3.Database(this.dbPath);
  }

  // List all tables
  listTables() {
    return new Promise((resolve, reject) => {
      this.db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map(row => row.name));
      });
    });
  }

  // View table data
  getTableData(tableName, limit = 10) {
    return new Promise((resolve, reject) => {
      this.db.all(`SELECT * FROM ${tableName} LIMIT ?`, [limit], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Insert data
  insert(tableName, data) {
    return new Promise((resolve, reject) => {
      const columns = Object.keys(data);
      const placeholders = columns.map(() => '?');
      const sql = `INSERT INTO ${tableName} (${columns.join(',')}) VALUES (${placeholders.join(',')})`;

      this.db.run(sql, Object.values(data), function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  // Update data
  update(tableName, data, conditions) {
    return new Promise((resolve, reject) => {
      const setColumns = Object.keys(data).map(col => `${col} = ?`).join(', ');
      const whereClause = Object.keys(conditions).map(col => `${col} = ?`).join(' AND ');
      const sql = `UPDATE ${tableName} SET ${setColumns} WHERE ${whereClause}`;

      const values = [...Object.values(data), ...Object.values(conditions)];

      this.db.run(sql, values, function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  }
}

// Usage Example:
const dbService = new DatabaseService();

// List tables
dbService.listTables().then(tables => {
  console.log('Available tables:', tables);
});

// View project data
dbService.getTableData('projects').then(data => {
  console.log('Projects:', data);
});

// Insert test data
dbService.insert('projects', {
  name: 'New Test Project',
  description: 'Created via Node.js API',
  status: 'planning'
}).then(id => {
  console.log('New project ID:', id);
});
```

### **Standalone Management Scripts:**

```javascript
#!/usr/bin/env node
// scripts/sqlite-manager.js

const sqlite3 = require('sqlite3').verbose();
const args = process.argv.slice(2);
const command = args[0];

if (!command) {
  console.log(`
Usage: node scripts/sqlite-manager.js <command> [options]

Commands:
  list-tables              - List all database tables
  view-table <name> [limit] - View table data (default limit: 10)
  count-records <table>    - Count records in table
  create-backup           - Create database backup
  table-info <table>       - Show table schema and statistics
  health-check             - Run database integrity check
  search <table> <column> <value> - Search specific data

Examples:
  node scripts/sqlite-manager.js list-tables
  node scripts/sqlite-manager.js view-table projects 5
  node scripts/sqlite-manager.js count-records users
  node scripts/sqlite-manager.js search projects name "Test"
`);
  process.exit(0);
}

const db = new sqlite3.Database('database.db');

function executeCommand() {
  switch(command) {
    case 'list-tables':
      db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
        if (err) return console.error('Error:', err.message);
        console.log('Database Tables:');
        tables.forEach(tbl => console.log(`  - ${tbl.name}`));
        db.close();
      });
      break;

    case 'view-table':
      const tableName = args[1];
      const limit = parseInt(args[2]) || 10;
      if (!tableName) return console.log('❌ Table name required');

      db.all(`SELECT * FROM ${tableName} LIMIT ?`, [limit], (err, rows) => {
        if (err) return console.error('Error:', err.message);
        console.log(`First ${limit} rows from ${tableName}:`);
        console.table(rows);
        db.close();
      });
      break;

    case 'count-records':
      const countTable = args[1];
      if (!countTable) return console.log('❌ Table name required');

      db.get(`SELECT COUNT(*) as count FROM ${countTable}`, (err, row) => {
        if (err) return console.error('Error:', err.message);
        console.log(`${countTable}: ${row.count} records`);
        db.close();
      });
      break;

    case 'create-backup':
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const backupFile = `database_backup_${timestamp}.sql`;

      db.all(".dump", (err, dump) => {
        if (err) return console.error('Error creating backup:', err.message);

        const fs = require('fs');
        fs.writeFileSync(backupFile,

dump.join('\n'));
        console.log(`✅ Backup created: ${backupFile}`);
        db.close();
      });
      break;

    case 'table-info':
      const infoTable = args[1];
      if (!infoTable) return console.log('❌ Table name required');

      // Get column information
      db.all(`PRAGMA table_info(${infoTable})`, (err, columns) => {
        if (err) return console.error('Error:', err.message);

        console.log(`\nTable: ${infoTable}\n`);
        console.log('Columns:');
        columns.forEach(col => {
          console.log(`  - ${col.name}: ${col.type}${col.notnull ? ' NOT NULL' : ''}${col.pk ? ' (PRIMARY KEY)' : ''}${col.dflt_value ? ' DEFAULT ' + col.dflt_value : ''}`);
        });

        // Get row count
        db.get(`SELECT COUNT(*) as count FROM ${infoTable}`, (err, row) => {
          console.log(`\nRecords: ${row.count}\n`);
          db.close();
        });
      });
      break;

    case 'health-check':
      db.get("PRAGMA integrity_check", (err, result) => {
        if (err) return console.error('Health check failed:', err.message);

        if (result.integrity_check === 'ok') {
          console.log('✅ Database integrity: OK');
        } else {
          console.log('❌ Database integrity issues found');
          console.log(result);
        }
        db.close();
      });
      break;

    case 'search':
      const searchTable = args[1];
      const searchColumn = args[2];
      const searchValue = args[3];

      if (!searchTable || !searchColumn || !searchValue) {
        return console.log('❌ Usage: search <table> <column> <value>');
      }

      const likeValue = `%${searchValue}%`;
      db.all(`SELECT * FROM ${searchTable} WHERE ${searchColumn} LIKE ? LIMIT 20`, [likeValue], (err, rows) => {
        if (err) return console.error('Error:', err.message);

        console.log(`Search results for "${searchValue}" in ${searchTable}.${searchColumn}:`);
        if (rows.length === 0) {
          console.log('  No matching records found');
        } else {
          console.table(rows);
          if (rows.length === 20) {
            console.log('... showing first 20 results');
          }
        }
        db.close();
      });
      break;

    default:
      console.log(`❌ Unknown command: ${command}`);
      db.close();
  }
}

executeCommand();
```

## 💻 VS Code Integration

### **🛠️ VS Code SQLite Extension Troubleshooting**

**"Cannot see the extension in VS Code menu on left"** - Here's the complete fix:

---

#### **🔍 Step 1: Verify Extension Status**
1. **Open VS Code**
2. **Extensions Panel:** `Cmd+Shift+X` (Mac) / `Ctrl+Shift+X` (PC)
3. **Search:** `sqlite`
4. **Check:**
   - ✅ Is "SQLite" by `alexcvzz` installed?
   - ✅ Is it enabled? (Should have reload button if disabled)
   - ❌ Any other SQLite extensions? (Disable conflicting ones)

---

#### **🔄 Step 2: Complete VS Code Restart** 
**CRITICAL:** Extensions don't always activate without full restart:

1. **Cmd+Q** (Mac) or **File → Exit** (Windows/Linux) - **QUIT** VS Code completely
2. **Wait 10 seconds** (let background processes stop)
3. **Restart VS Code**
4. **Re-open your workspace/folder**

---

#### **⚡ Step 3: Force Extension Load**
Sometimes extensions need manual activation:

1. **After restart:** `Cmd+Shift+P` → "Developer: Reload Window"
2. **Check Activity Bar:** Look for new "Database" icon on left sidebar
3. **If missing:** `Cmd+Shift+P` → "Extensions: Enable All"

---

#### **🎯 Step 4: Verify Extension Activation**
**In VS Code:**
- Press `Cmd+Shift+P` → Type "SQLite"
- Should see commands like:
  - ✅ SQLite: Open Database
  - ✅ SQLite: Run Query
  - ✅ SQLite: Close Database

If not, the extension isn't properly loaded.

---

#### **🔧 Step 5: Extension Reinstallation**
If above doesn't work:

1. **Extensions Panel** → Find "SQLite" by alexcvzz
2. **Click the ... menu** → "Uninstall"
3. **Wait for uninstall** → Restart VS Code
4. **Install again:** Search "SQLite" → Install `alexcvzz.sqlite`
5. **Full restart** after install

---

#### **🚨 Known VS Code Extension Issues & Fixes:**

**Issue: Extension installed but no icon/menu**
- **Fix:** Full quit + restart (not just window reload)

**Issue: Multiple SQLite extensions conflict**
- **Fix:** Disable/uninstall other SQLite extensions, keep only `alexcvzz.sqlite`

**Issue: Extension shows installed but commands missing**
- **Fix:** Settings → Extensions → Enable SQLite extension

**Issue: Database file not opening**
- **Fix:** `Cmd+Shift+P` → "SQLite: Open Database" → Navigate to select `database.db`

---

#### **✅ Post-Fix Verification**
After fixing, you should see:
1. **Activity Bar:** Database icon (looks like a database cylinder)
2. **Command Palette:** SQLite commands available
3. **Explorer:** database.db appears when opened

---

### **📊 SQLite Extension for VS Code: Suitability Assessment** *(Once Working)*

**HIGHLY RECOMMENDED** for your 300+ table SQLite-First workflow when working.

#### **✅ Strengths (Perfect for Your Use Case):**

**1. ⚡ Fastest Development Loop**
```
Code ↔ Database ↔ Query Testing
All in VS Code - 10x faster iteration!
```

**2. 🔍 Enterprise-Scale Table Management**
- ✅ **300+ Tables:** Perfect sidebar navigation
- ✅ **In-IDE Schema:** Explore without leaving code
- ✅ **Query Testing:** Try SQL before implementing

**3. 🎮 Development Workflow Integration**
- ✅ **Debug Queries:** Test SQL in same IDE as code
- ✅ **Data Inspection:** View application data while coding
- ✅ **Rapid Prototyping:** Changes without tool switching

**4. 📱 Lightweight**
- ✅ **Native Integration:** Works with existing workflow
- ✅ **Minimal Overhead:** VS Code handles it efficiently
- ✅ **Workspace Config:** Save database paths

---

#### **🎯 Best Use Cases (Your Perfect Match):**
- **SQLite-First Development:** Primary workflow
- **Schema Exploration:** Understand tables while coding
- **Query Testing:** Prototype SQL queries
- **Data Debugging:** Inspect app data issues
- **Rapid Iteration:** Code → Test → Debug loop

---

#### **🚀 Usage (After Fix):**
```bash
# Daily workflow:
1. npm run dev:sqlite:fresh    # Get database ready
2. Cmd+Shift+P → "SQLite: Open Database"
3. Select database.db
4. ⚡ Browse 300+ tables in sidebar instantly!
```

**Expected View:**
```
Activity Bar (Left Side)
├── Files
├── Search
├── Source Control
├── Extensions
└── 🗃️ Database     ← This icon appears after fix

EXPLORER Sidebar
├── ⚙️ PROJECT ROOT
├── database.db     ← Expanded to show tables
│   ├── 📋 Tables
│   │   ├── projects
│   │   ├── users
│   │   └── 285+ more tables
│   ├── 🏗️ Views
│   └── 📊 Indexes
```

---

### **🔄 Alternative: Working Solutions While Troubleshooting**

**Don't wait for VS Code fix - use these immediately:**

#### **🌐 Browser-Based (Instant Access):**
```bash
# Go to: https://sqliteonline.com/
# Upload: database.db file
# ✅ Browse all 300+ tables now!
```

#### **⚡ CLI Access (Power Commands):**
```bash
sqlite3 database.db ".tables"                        # List all tables
sqlite3 database.db ".schema projects"             # Table structure
sqlite3 database.db "SELECT * FROM projects LIMIT 5;" # View data
```

#### **🖥️ GUI Desktop App:**
```bash
brew install db-browser-for-sqlite     # Install (one-time)
db-browser-for-sqlite database.db      # Launch visual browser
```

---

#### **📋 Summary: Get SQLite Access Now**

**Immediate Working Solutions:**
1. **🌐 Browser:** https://sqliteonline.com/ → Upload database.db
2. **⚡ CLI:** `sqlite3 database.db ".tables"` → Full commands available  
3. **🖥️ Desktop:** `brew install db-browser-for-sqlite` → Visual interface

**VS Code Extension (Fix Steps):**
1. Confirm extension installed (`alexcvzz.sqlite`)
2. **Full quit + restart** VS Code (critical!)
3. Check activity bar for database icon
4. Use `Cmd+Shift+P` → "SQLite: Open Database"

**Most VS Code extension issues resolve with a complete quit → restart. The browser/CLI solutions work immediately while you fix the extension!** 🎉

## 📊 Performance & Monitoring

### **Database Maintenance Commands:**

```bash
# Optimize database (reclaim space)
sqlite3 database.db "VACUUM;"

# Analyze query performance
sqlite3 database.db "EXPLAIN QUERY PLAN SELECT * FROM projects WHERE status = 'active';"

# View database statistics
sqlite3 database.db "SELECT * FROM sqlite_stat1;"  # Index statistics

# Monitor connection info
sqlite3 database.db "SELECT * FROM pragma_table_list WHERE name LIKE 'sqlite_%';"
```

### **Index Management:**

```bash
# View existing indexes
sqlite3 database.db "SELECT name, sql FROM sqlite_master WHERE type='index';"

# Create performance index (if needed)
sqlite3 database.db "CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);"

# Analyze index usage
sqlite3 database.db "ANALYZE projects;"  # Analyze table
sqlite3 database.db "SELECT * FROM sqlite_stat1 WHERE tbl = 'projects';"
```

## 🛡️ Safety & Best Practices

### **Never Modify Production Data:**
- Your `database.db` is **development-only**
- **Never** connect to production databases with these tools
- Use `npm run sqlite:migrate` for production schema changes

### **Backup Before Major Operations:**

```bash
# Always backup before bulk operations
cp database.db database.backup.$(date +%Y%m%d_%H%M%S)

# For table modifications
sqlite3 database.db ".dump my_table" > table_backup.sql
```

### **Transaction Safety:**

```bash
# Use transactions for multi-statement operations
sqlite3 database.db << 'EOF'
BEGIN TRANSACTION;

-- Multiple operations here
INSERT INTO projects (name, status) VALUES ('New Project', 'planning');
UPDATE users SET last_login = datetime('now') WHERE id = 1;

COMMIT;  -- Or ROLLBACK on error
EOF
```

### **Data Validation:**

```javascript
// Script to validate data integrity
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.db');

db.get("PRAGMA integrity_check", (err, result) => {
  if (result.integrity_check !== 'ok') {
    console.error('❌ Database corruption detected!');
    console.error(result);
    process.exit(1);
  } else {
    console.log('✅ Database integrity confirmed');
  }
  db.close();
});
```

## 🚀 Quick Start Commands (Add to package.json)

### **Recommended Package.json Scripts:**

```json
{
  "scripts": {
    "db:list": "node scripts/sqlite-manager.js list-tables",
    "db:view": "node scripts/sqlite-manager.js view-table",
    "db:count": "node scripts/sqlite-manager.js count-records",
    "db:backup": "node scripts/sqlite-manager.js create-backup",
    "db:info": "node scripts/sqlite-manager.js table-info",
    "db:search": "node scripts/sqlite-manager.js search",
    "db:check": "node scripts/sqlite-manager.js health-check",
    "db:browse": "sqlite3 database.db",
    "gui:browse": "db-browser-for-sqlite database.db"
  }
}
```

### **Usage Examples:**

```bash
# Quick database overview
npm run db:list                    # List all tables
npm run db:view projects          # View projects table
npm run db:count users            # Count user records
npm run db:backup                 # Create backup file

# Advanced queries
npm run db:info document_categories # Detailed table info
npm run db:search projects name "AI" # Search for AI projects
npm run db:check                   # Integrity verification
```

## 🔄 Development Workflow Integration

### **Debug Integration:**

```javascript
// Add to any server file for runtime debugging
const dbCheck = () => {
  const db = new sqlite3.Database('database.db');

  // Check if tables exist
  db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (!tables.find(t => t.name === 'projects')) {
      console.warn('⚠️  Warning: Projects table missing from database');
    }
  });

  // Validate connection
  db.get("SELECT sqlite_version() as version", (err, row) => {
    console.log(`📊 SQLite Version: ${row.version}`);
  });

  db.close();
};

// Call during app startup
dbCheck();
```

### **Hot Reloading Support:**

```javascript
// For development: Monitor database changes
const fs = require('fs');

fs.watchFile('database.db', { interval: 1000 }, (curr, prev) => {
  console.log('🔄 Database file changed - reloading schema cache...');
  // Trigger schema cache refresh
});
```

This comprehensive guide provides everything needed to effectively interface with your SQLite databases for the SQLite-First workflow. Choose the appropriate tool based on your task and development preferences.
