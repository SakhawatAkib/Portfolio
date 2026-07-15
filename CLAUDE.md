# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

This is a **portfolio / media-asset repository** for game developer Sakhawat Hossain (GitHub `@SakhawatAkib`), a Unity 3D developer. It contains no application source code, no build system, and no tests. It exists to showcase shipped games and hold job-application materials.

Because there is nothing to build, lint, or test, most "development" tasks here are content operations: adding a new game's assets, updating the CV/cover letter, or curating media. Do not invent build/test workflows.

## Structure and conventions

Assets are organized **per game title**, and the same set of folder names must stay in sync across the three media directories:

- `Game Icons/<Game Title>/` — the game's icon image(s)
- `Game Screenshoot/<Game Title>/` — numbered screenshots (`1.png`, `2.png`, …)
- `Game Video/<Game Title>.mp4` — one gameplay video per game (note: file here, not a folder)

When adding a new game, create the matching `<Game Title>` entry in **both** `Game Icons/` and `Game Screenshoot/`, plus a `<Game Title>.mp4` in `Game Video/`. Keep the title spelling identical across all three so they correspond. (Existing folder names are the source of truth for exact spelling — e.g. the video for "Block Pack Jam" is currently named `Block Pack Mania.mp4`, an inconsistency worth flagging rather than silently copying.)

Root-level application materials: `Sakhawat_Hossain_CV.pdf`, `Cover Letter.pdf`, `Profile Picture.jpg`, and `Show Case Game playable link.txt` (a public Unity Play URL for the featured game, "Little Adventure 3D").

## Git LFS

`.gitattributes` routes **all `*.mp4` files through Git LFS**. Any video added to `Game Video/` (or `Show Case Video.mp4` at root) is stored via LFS, not committed inline. Ensure `git lfs` is installed before cloning/pushing videos, or the `.mp4` files will appear as small pointer text files instead of real media.

## Notes

- `README.md` is a GitHub **profile** README (it renders on the user's profile page because the account/repo name matches). Edits to it change what visitors see on the profile, not project docs.
