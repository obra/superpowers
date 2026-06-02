# Stop the brainstorm server and clean up
# Usage: stop-server.ps1 <session_dir>
#
# Kills the server process. Only deletes session directory if it's
# under $env:TEMP (ephemeral). Persistent directories (.superpowers\) are
# kept so mockups can be reviewed later.

param(
    [string]$SessionDir = ""
)

if (-not $SessionDir) {
    Write-Output '{"error": "Usage: stop-server.ps1 <session_dir>"}'
    exit 1
}

$StateDir = Join-Path $SessionDir "state"
$PidFile = Join-Path $StateDir "server.pid"

if (Test-Path $PidFile) {
    $pidStr = Get-Content $PidFile
    $procId = [int]$pidStr

    # Try to stop gracefully
    try { Stop-Process -Id $procId -ErrorAction SilentlyContinue } catch { }

    # Wait for graceful shutdown (up to ~2s)
    $maxWait = 20
    $stopped = $false
    for ($i = 0; $i -lt $maxWait; $i++) {
        try {
            $p = Get-Process -Id $procId -ErrorAction Stop
            Start-Sleep -Milliseconds 100
        } catch {
            $stopped = $true
            break
        }
    }

    # If still running, escalate to force kill
    if (-not $stopped) {
        try { Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue } catch { }
        Start-Sleep -Milliseconds 100
    }

    # Final check
    try {
        $p = Get-Process -Id $procId -ErrorAction Stop
        Write-Output '{"status": "failed", "error": "process still running"}'
        exit 1
    } catch {
        # Process is dead, good
    }

    Remove-Item -Force $PidFile -ErrorAction SilentlyContinue
    Remove-Item -Force (Join-Path $StateDir "server.log") -ErrorAction SilentlyContinue

    # Only delete ephemeral $env:TEMP directories
    $tempPrefix = $env:TEMP
    if ($SessionDir.StartsWith($tempPrefix, [StringComparison]::OrdinalIgnoreCase)) {
        Remove-Item -Recurse -Force $SessionDir -ErrorAction SilentlyContinue
    }

    Write-Output '{"status": "stopped"}'
} else {
    Write-Output '{"status": "not_running"}'
}
