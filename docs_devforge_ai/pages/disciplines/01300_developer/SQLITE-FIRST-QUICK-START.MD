# 🚀 SQLite-First Development Workflow - Quick Start

**⚡ Get Started with 300+ Tables Instantly Available in Development**

---

## 🔥 **One-Command Solutions (Recommended)**

| Command | Purpose | What It Does |
|---------|---------|--------------|
| **`npm run dev:sqlite:fresh`** ⭐ | **Daily Development** | SQLite env + full cache clear + schema refresh + server |
| `npm run dev:demo:fresh` | **Demo Testing** | Supabase demo + full cache clear + server |
| `npm run dev:prod:fresh` | **Production Preview** | Supabase prod + full cache clear + server |

---

## 🏃 **Quick Commands**

```bash
# Environment switching (no cache clearing)
npm run switch:sqlite      # Switch to SQLite environment
npm run switch:demo        # Switch to demo environment

# SQLite-First setup & management
npm run sqlite:setup       # One-time SQLite ecosystem setup
npm run sqlite:migrate     # Generate safe production migrations
npm run sqlite:convert     # Convert PostgreSQL → SQLite schemas
```

---

## 📋 **Complete Workflow**

### **Step 1: Initial Setup (One-Time)**
```bash
npm run sqlite:setup     # Exports 300+ schemas + converts to SQLite + sets up environment
```

### **Step 2: Daily Development**
```bash
npm run dev:sqlite:fresh # One command = everything ready for coding
```

### **Step 3: Schema Changes**
```bash
# Modify SQLite tables directly (all 300+ tables available)
# Test locally instantly
npm run sqlite:migrate   # Generate safe production migration when ready
```

### **Step 4: Deployment**
- Apply migration through your existing deployment process
- Production data remains untouched
- Demo environment for thorough testing

---

## 🎯 **Key Benefits**

- **⚡ Instant Development**: All 300+ tables available instantly
- **🛡️ Safe Production**: Supabase data never touched during development
- **🚀 One Command**: Environment + cache + schema + server ready
- **👥 Team Ready**: Clear migration workflow for coordination
- **🔍 Demo Compatible**: Existing presentations continue working

---

## 📚 **Documentation**

### **Complete Guides**
- **[SQLite-First Workflow](docs/0305_SQLITE_FIRST_WORKFLOW.md)** - Complete development guide
- **[Cache Prevention](docs/0010_CACHE_PREVENTION_GUIDE.md)** - Cache & environment management
- **[Script Documentation](scripts/0305_sqlite_workflow/README.md)** - Technical details

### **Quick Support**
- **Questions?** Check the detailed workflow guide above
- **Cache Issues?** Use `:fresh` commands (they always work)
- **Schema Changes?** Local SQLite → `npm run sqlite:migrate` → Production

---

## 🛡️ **Safety First**

| Operation | Safety Level | Data Access |
|-----------|--------------|-------------|
| **SQLite Development** | 🔓 Full Access | Local `database.db` only |
| **Demo Environment** | 🔒 Read-Only | Shared demo data (careful!) |
| **Production** | 🔒 No Direct Access | Migration scripts only |

---

## 🚀 **From Setup to Development: 5 Minutes**

```bash
# 1. One-time setup
npm run sqlite:setup

# 2. Start developing (forever after)
npm run dev:sqlite:fresh

# 3. You're done! All 300+ tables ready for coding 🎉
```

**⚡ No more waiting for databases. No more cache confusion. Just instant development across your entire enterprise schema.**

---

*SQLite-First Workflow - Transforming 300+ table development from bottleneck to competitive advantage*
