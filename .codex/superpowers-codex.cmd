@echo off
setlocal

REM Windows shim for the extensionless Unix-style Node launcher (superpowers-codex).
REM This enables running:
REM   C:\Users\dan\.codex\superpowers\.codex\superpowers-codex.cmd bootstrap
REM or (in many shells) just:
REM   superpowers-codex bootstrap
REM when this directory is on PATH.

node "%~dp0superpowers-codex" %*

