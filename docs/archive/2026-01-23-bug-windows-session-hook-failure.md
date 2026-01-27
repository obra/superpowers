# Bug: Windows 平台 session-start hook 失效

## 基本信息
- 创建时间: 2026-01-23
- 优先级: 高
- 影响范围: Windows 平台用户

## Bug 描述

在 Windows 平台上，`using-horspowers` skill 无法通过 session-start hook 正确注入，导致技能系统完全失效。

## 根本原因

`hooks/run-hook.cmd:11` 使用硬编码的 Git Bash 路径：

```batch
"C:\Program Files\Git\bin\bash.exe" -l "%~dp0%~1" %2 %3 %4 %5 %6 %7 %8 %9
```

**问题：**
- Git 可能安装在不同位置（`D:\Program Files\Git`, `C:\Program Files (x86)\Git` 等）
- 用户可能使用 WSL 而非 Git Bash
- 便携版 Git 可能安装在 `%LOCALAPPDATA%\Programs\Git`

## 解决方案

### 修复 run-hook.cmd (动态查找 bash)

使用 `where bash` 或常见路径检测来动态定位 bash.exe：

```batch
@echo off
setlocal

REM Try to find bash.exe in common locations
set "BASH_EXE="

REM Check PATH first
for /f "delims=" %%i in ('where bash 2^>nul') do (
    set "BASH_EXE=%%i"
    goto :found
)

REM Fallback to common Git installation paths
if exist "C:\Program Files\Git\bin\bash.exe" (
    set "BASH_EXE=C:\Program Files\Git\bin\bash.exe"
    goto :found
)
if exist "C:\Program Files (x86)\Git\bin\bash.exe" (
    set "BASH_EXE=C:\Program Files (x86)\Git\bin\bash.exe"
    goto :found
)
if exist "%LOCALAPPDATA%\Programs\Git\bin\bash.exe" (
    set "BASH_EXE=%LOCALAPPDATA%\Programs\Git\bin\bash.exe"
    goto :found
)

REM Not found
echo Error: bash.exe not found. Please install Git for Windows. >&2
exit /b 1

:found
"%BASH_EXE%" -l "%~dp0%~1" %2 %3 %4 %5 %6 %7 %8 %9
endlocal
```

## 验收标准

- [ ] Windows 平台 session-start hook 能正常工作
- [ ] run-hook.cmd 能在各种 Git 安装路径下找到 bash.exe
- [ ] 在 Windows 环境下测试通过

## 相关文件

- [hooks/run-hook.cmd](../hooks/run-hook.cmd)
- [hooks/session-start.sh](../hooks/session-start.sh)
- [hooks/hooks.json](../hooks/hooks.json)

## 进展记录

- 2026-01-23: Bug 创建 - 待修复
