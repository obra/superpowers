---
name: init
description: "Use when initializing a new Spectral workspace in the current directory. Creates a .spectral folder with a test subfolder."
---

# Spectral Init

Use this skill when the user wants to initialize Spectral in the current working directory.

## First Version Behavior

Create the following directory structure relative to the current working directory:

```text
.spectral/
  test/
```

## Steps

1. Use the platform shell tool to create `.spectral/test` in the current working directory.
2. Do not overwrite existing files or directories.
3. Confirm the directory was created successfully.
4. Report the resulting path back to the user.

## Scope

This first version only initializes the folder structure. Do not add additional configuration files yet.