@echo off
setlocal

REM Windows shim for the extensionless Node.js launcher (superpowers-codex).
REM
REM Windows cannot execute extensionless scripts with shebangs, so this wrapper
REM invokes Node.js directly.
REM
REM Usage:
REM   superpowers-codex.cmd bootstrap
REM   superpowers-codex.cmd use-skill superpowers:brainstorming
REM   superpowers-codex.cmd find-skills

node "%~dp0superpowers-codex" %*
