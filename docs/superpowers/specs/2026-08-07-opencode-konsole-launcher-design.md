# OpenCode Konsole Launcher

## Purpose

Provide a user-level application launcher for the sandboxed OpenCode wrapper, using the Bearings logo and opening in Konsole.

## Behavior

The launcher appears as `Bearings - OpenCode Sandbox` in the user's application menu. Activating it starts Konsole in the user's home directory and executes `~/.local/bin/opencode`. The wrapper therefore mounts the launch directory as the writable sandbox directory.

## Files

- `~/.local/share/applications/bearings-opencode.desktop` contains the launcher metadata and command.
- `~/.local/share/icons/hicolor/512x512/apps/bearings-opencode.png` contains a copy of the existing Bearings logo.

## Verification

Validate that the desktop entry has the required application fields, the icon exists, Konsole exists, and the command points to the sandbox wrapper rather than the raw binary.
