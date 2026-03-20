# Port Management Guide

## Overview

This application uses a deterministic port management system to eliminate guesswork and ensure consistent behavior across different environments.

## Port Configuration

### Default Ports
- **API Server (Main Application)**: `3060`
- **Client Development Server**: `3001`

### Environment Variables
Ports are controlled via `.env` file:
```bash
API_PORT=3060                           # Main application server
CLIENT_DEV_PORT=3001                   # Development server with hot reload
REACT_APP_API_BASE_URL=http://localhost:3060  # Frontend API endpoint
```

## Startup Scripts

### Production Mode
```bash
npm start
# OR
./start-app.sh
```
- Builds client assets
- Starts only the API server on port 3060
- **Use this URL**: http://localhost:3060

### Development Mode
```bash
npm run dev
# OR
./start-dev.sh
```
- Starts API server on port 3060
- Starts client dev server on port 3001 (with hot reload)
- **Main Application**: http://localhost:3060
- **Development Tools**: http://localhost:3001

### Check Port Status
```bash
npm run ports
```
Shows which ports are in use and provides the correct URLs.

## Which URL to Use?

### For Testing Accordion Functionality
**Always use**: http://localhost:3060

This is the main application server that:
- Serves the built client assets
- Handles all API requests
- Provides the complete application experience
- Has the accordion functionality you need to test

### For Development with Hot Reload
**Use**: http://localhost:3001

This is the webpack dev server that:
- Provides hot module replacement
- Shows compilation errors in browser
- Useful for active development
- May not have all production features

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Architecture                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Port 3060 (API Server - Node.js/Express)                  │
│  ├── Serves built client assets from client/dist2/         │
│  ├── Handles API routes (/api/*)                           │
│  ├── Manages database connections                          │
│  └── Main application entry point                          │
│                                                             │
│  Port 3001 (Client Dev Server - Webpack)                   │
│  ├── Development only                                       │
│  ├── Hot module replacement                                 │
│  ├── Source maps and debugging                             │
│  └── Proxies API calls to port 3060                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Troubleshooting

### Port Already in Use
The startup scripts automatically kill existing processes on the required ports.

### Manual Port Cleanup
```bash
# Kill process on port 3060
lsof -t -i :3060 | xargs kill -9

# Kill process on port 3001
lsof -t -i :3001 | xargs kill -9
```

### Check What's Running
```bash
# See what's using the ports
lsof -i :3060
lsof -i :3001

# See all listening ports
netstat -an | grep LISTEN
```

## Key Points

1. **Always use port 3060 for testing the main application**
2. **Port 3001 is for development tools only**
3. **The startup scripts handle port cleanup automatically**
4. **Environment variables in `.env` control the port configuration**
5. **No more guesswork - ports are deterministic and documented**

## Quick Reference

| Purpose | Command | URL |
|---------|---------|-----|
| Production | `npm start` | http://localhost:3060 |
| Development | `npm run dev` | http://localhost:3060 (main) + http://localhost:3001 (dev tools) |
| Port Status | `npm run ports` | Shows current port usage |
| Accordion Testing | N/A | **http://localhost:3060** |
