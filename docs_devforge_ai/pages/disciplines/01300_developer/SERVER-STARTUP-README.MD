# ConstructAI Development Server Startup Guide

## 🚀 Problem: ERR_CONNECTION_REFUSED on localhost:3001 & localhost:3060

This guide provides an easy way to start and stop your development servers.

## 📋 Quick Start

### 1. Start Both Servers
```bash
./start_servers.sh
```

This script will:
- ✅ Check you're in the right directory
- ✅ Start the backend API server on port 3060
- ✅ Start the client React app on port 3001
- ✅ Verify both servers are running
- ✅ Show connection URLs

### 2. Access Your Application
- **Frontend (React App)**: http://localhost:3001
- **Backend API**: http://localhost:3060
- **Health Check**: http://localhost:3060/health

## 🛑 Stop Servers
To stop all running servers:
```bash
./stop_servers.sh
```

## 🔍 Manual Commands (If Script Doesn't Work)

### Backend Server Only
```bash
npm start
```

### Client Server Only
```bash
cd client
npm run start:client
```

## 📁 Files Created
- `start_servers.sh` - Automated server startup script
- `stop_servers.sh` - Server shutdown script
- `server.log` - Backend server output
- `client.log` - Client server output
- `server_pids.txt` - Process IDs (auto-deleted on stop)

## 🔧 Troubleshooting

### If Scripts Won't Run
```bash
chmod +x start_servers.sh
chmod +x stop_servers.sh
```

### If Ports Still Not Accessible
1. Check if any other processes are using ports 3001/3060:
   ```bash
   lsof -i :3001 -i :3060
   ```
2. Kill any conflicting processes:
   ```bash
   pkill -f "webpack\|node.*server"
   ```

### View Server Logs
- Backend logs: `tail -f server.log`
- Client logs: `tail -f client.log`

## ✅ Success Indicators
- **Backend**: Shows "Server running on port 3060"
- **Client**: Shows webpack compilation and "Project is running at http://localhost:3001"
- **Browser**: No more ERR_CONNECTION_REFUSED errors

Your development environment should now be fully functional!
