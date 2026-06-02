# Start the brainstorm server and output connection info
# Usage: start-server.ps1 [-ProjectDir <path>] [-Host <bind-host>] [-UrlHost <display-host>] [-Foreground] [-Background]
#
# Starts server on a random high port, outputs JSON with URL.
# Each session gets its own directory to avoid conflicts.
#
# Options:
#   -ProjectDir <path>  Store session files under <path>\.superpowers\brainstorm\
#                       instead of $env:TEMP. Files persist after server stops.
#   -Host <bind-host>   Host/interface to bind (default: 127.0.0.1).
#                       Use 0.0.0.0 in remote/containerized environments.
#   -UrlHost <host>     Hostname shown in returned URL JSON.
#   -Foreground         Run server in the current terminal (no backgrounding).
#   -Background         Force background mode.

param(
    [string]$ProjectDir = "",
    [string]$Host = "127.0.0.1",
    [string]$UrlHost = "",
    [switch]$Foreground = $false,
    [switch]$Background = $false
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

if (-not $UrlHost) {
    if ($Host -eq "127.0.0.1" -or $Host -eq "localhost") {
        $UrlHost = "localhost"
    } else {
        $UrlHost = $Host
    }
}

$ForceBackground = $Background

# Codex CI auto-foreground detection
if ($env:CODEX_CI -and -not $Foreground -and -not $ForceBackground) {
    $Foreground = $true
}

# On Windows, background processes via Start-Process may not survive tool call boundaries.
# Auto-foreground when NOT explicitly forced to background.
if (-not $Foreground -and -not $ForceBackground) {
    $Foreground = $true
}

# Generate unique session directory
$SessionId = "$pid-$(Get-Date -UFormat '%s')"

if ($ProjectDir) {
    $SessionDir = Join-Path $ProjectDir ".superpowers\brainstorm\$SessionId"
} else {
    $SessionDir = Join-Path $env:TEMP "brainstorm-$SessionId"
}

$StateDir = Join-Path $SessionDir "state"
$PidFile = Join-Path $StateDir "server.pid"
$LogFile = Join-Path $StateDir "server.log"

# Create fresh session directory with content and state peers
New-Item -ItemType Directory -Force -Path (Join-Path $SessionDir "content") | Out-Null
New-Item -ItemType Directory -Force -Path $StateDir | Out-Null

# Kill any existing server
if (Test-Path $PidFile) {
    $oldPid = Get-Content $PidFile
    try { Stop-Process -Id ([int]$oldPid) -Force -ErrorAction SilentlyContinue } catch { }
    Remove-Item -Force $PidFile -ErrorAction SilentlyContinue
}

Set-Location -LiteralPath $ScriptDir

# Resolve the harness PID (grandparent of this script).
$ppid = (Get-WmiObject Win32_Process -Filter "ProcessId=$pid").ParentProcessId
if ($ppid) {
    try {
        $OwnerPid = (Get-WmiObject Win32_Process -Filter "ProcessId=$ppid").ParentProcessId
    } catch {
        $OwnerPid = $ppid
    }
} else {
    $OwnerPid = $pid
}
if (-not $OwnerPid -or $OwnerPid -eq 1) {
    $OwnerPid = $ppid
}

if ($Foreground) {
    $pid | Set-Content $PidFile
    $env:BRAINSTORM_DIR = $SessionDir
    $env:BRAINSTORM_HOST = $Host
    $env:BRAINSTORM_URL_HOST = $UrlHost
    $env:BRAINSTORM_OWNER_PID = "$OwnerPid"
    & node server.cjs
    exit $LASTEXITCODE
}

# Background mode: start the node process detached
$proc = Start-Process -FilePath "node" `
    -ArgumentList "server.cjs" `
    -NoNewWindow `
    -PassThru

$ServerPid = $proc.Id
$ServerPid | Set-Content $PidFile

# Wait for server-started message (check if process alive + server-info file exists)
$maxWait = 50
for ($i = 0; $i -lt $maxWait; $i++) {
    if (Test-Path (Join-Path $StateDir "server-info")) {
        $info = Get-Content (Join-Path $StateDir "server-info") -Raw
        if ($info -match "server-started") {
            # Verify server is still alive
            Start-Sleep -Milliseconds 200
            try {
                $alive = Get-Process -Id $ServerPid -ErrorAction Stop
                Write-Output $info.Trim()
                exit 0
            } catch {
                Write-Output '{"error": "Server started but was killed. Retry with -Foreground flag."}'
                exit 1
            }
        }
    }
    Start-Sleep -Milliseconds 100
}

Write-Output '{"error": "Server failed to start within 5 seconds"}'
exit 1
