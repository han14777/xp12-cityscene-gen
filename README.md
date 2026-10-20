# xp12-cityscene-gen

**English** | [简体中文](README.zh-CN.md)

Draw an area on a map and generate X-Plane 12 city building scenery in one go:
OpenStreetMap building outlines and heights → cleaning → X-Plane 12 default facades → DSF (which also hides the
default autogen buildings inside the area) → linked into Custom Scenery.

The pipeline is a generalised version of the one built for a Melbourne CBD scenery (melbourne-cbd-xp12).
City-specific data and hand-made landmark models were left out, so it works for any city.

## Download (Windows)

No Python needed: download `CityScene-<version>-windows-x64.zip` from
[Releases](https://github.com/han14777/xp12-cityscene-gen/releases/latest), unzip it anywhere you can write to,
and double-click `CityScene.exe`. The map UI opens in your browser. On first start DSFTool is downloaded from
Laminar Research (files.x-plane.com, checked against a SHA-256) into the `tools` folder, and X-Plane 12 is
found automatically. Jobs and generated scenery are kept inside the unzipped folder.

The rest of this README covers running from source.

## Requirements

- Python 3.11+: `pip install -e ".[dev]"`
- X-Plane 12 (its location is read automatically from `%LOCALAPPDATA%\x-plane_install_12.txt`)
- `DSFTool.exe` from Laminar's [XPTools](https://developer.x-plane.com/tools/xptools/): downloaded automatically
  into `tools/` on first use, or set your own path under "Local settings" in the UI (saved to `config/local.yaml`,
  which is not committed)

## Browser UI

```
python -m cityscene gui        # or double-click start_gui.bat
```

The UI is in English by default; switch with the EN / 中文 buttons next to the title (remembered by the browser).
Drag the divider next to the map to resize the panel (double-click resets it; the ‹ button hides it), and fold any
step by its title. Every path field has a "Browse…" button that opens the system's file dialog; paths can also be
typed. A model picked outside the job is copied into its `models/` folder together with its textures.

1. Search for a city, then draw rectangles or polygons with the tools at the top left of the map (several are fine)
2. Enter a job name and click "Save area and generate"; progress and logs appear as it runs
3. When done, buildings are shown on the map coloured by height; hover to see the height source and facade style
4. Quit X-Plane and click "Install to X-Plane"

## Importing a pack made by this tool

Every generated pack carries its job in `<pack>/cityscene/` (area, settings, edits, cleaned OSM buildings), so a
pack can be turned back into a job: open "Import a scenery pack made by this tool" under the job list (packs found
in Custom Scenery and the build folder are listed), or run `python -m cityscene import <pack folder>`. The pack is
copied; the original stays as it is. After importing you can edit buildings right away, or regenerate with
"Re-download OSM" ticked to refresh the data.

- A pack that is the build output of another copy of this tool (e.g. a release folder) brings the whole job,
  including the OSM download
- Packs from versions before this feature get their area back from the DSF exclusion zones; generate once to
  download OSM before editing
- If the pack is installed from another copy, uninstall it there before installing from this one

## Editing buildings and custom models

Click a building on the map (after generating) to open "Edit buildings":

- **Keep**, optionally with a new height (the tallest part; other parts scale with it) or a facade style
- **Delete** it
- **Replace with my model**: an OBJ placed at the building's centre, with heading and east / north offset

Edits are saved per OSM building in `jobs/<job>/overrides.json`, so re-downloading OSM or regenerating keeps them.
Click "Apply edits" to regenerate (classify + build_dsf only, no download).

For a custom model, put the `.obj` and its textures in `jobs/<job>/models/` (subfolders are fine) and enter the path
relative to that folder, e.g. `eureka/eureka.obj`; the whole folder is copied into the pack. An X-Plane library path
(e.g. `lib/...`) also works. The replaced building gets no facade or distant block.

To model a building in Blender: click "Download reference for Blender" (or
`python -m cityscene reference <job> way/123`) and import the file with File → Import → Wavefront (.obj) using the
default axes. It is the building's blocks around its placement point. Build on top of it and export with
[XPlane2Blender](https://github.com/X-Plane/XPlane2Blender); with heading 0 and no offset the model lines up with the
map. Models can also come from SketchUp or AC3D exporters, or be generated in code.

## Command line

```
python -m cityscene new sydney_cbd --bbox 151.200,-33.875,151.215,-33.860 --render-distance 30
python -m cityscene build sydney_cbd            # fetch → clean → classify → build_dsf
python -m cityscene build sydney_cbd --steps clean,classify,build_dsf   # after changing settings, no re-download
python -m cityscene install sydney_cbd
python -m cityscene uninstall sydney_cbd
python -m cityscene list
python -m cityscene reference sydney_cbd way/123   # one building as a Wavefront OBJ for Blender
python -m cityscene import "X-Plane 12/Custom Scenery/CityScene_sydney_cbd"   # pack -> job
```

`--zone area.geojson` works too (e.g. drawn and exported from geojson.io).

## Render distance

X-Plane 12's default facades stop drawing at 8–18 km (set inside each facade). Past that, merged low-poly blocks
with a simple window texture take over, up to the render distance chosen in the UI (default 30 km, `--render-distance`
on the command line, `dsf.render_distance_km` in the settings). A value below a facade's own range does not shorten
it. Larger distances cost some frame rate.

## Pipeline

| Step | What it does |
|------|--------------|
| fetch | Downloads `building`, `building:part` and `highway` from Overpass in grid chunks, cached per job; chunks already covering the area are reused |
| clean | Assembles outlines and relations, keeps buildings whose centroid is in the area, splits `building:part`s, fills heights (`height` → `building:levels` × level height → default), cuts or drops buildings sitting on roads, removes duplicates and overlaps (tallest wins) |
| classify | Sorts buildings into high / mid / low rise and heritage, and picks a default facade whose floor range fits |
| build_dsf | Writes one DSF per 1° tile with rectangle exclusions for objects and facades, compiles with DSFTool, then decompiles to check nothing was dropped. Adds simplified distant blocks so buildings stay visible up to the render distance |

## Files

| Path | Contents |
|------|----------|
| `config/settings.yaml` | Global defaults: height rules, cleaning thresholds, facade list, exclusion types |
| `config/local.yaml` | Machine paths (X-Plane, DSFTool), not committed |
| `jobs/<job>/` | `job.json`, `zone.geojson`, `raw/` (Overpass cache), `processed/` (intermediate results and reports), `overrides.json` (building edits), `models/` (custom OBJs), `build.log` |
| `build/<pack>/` | The generated scenery pack (`Earth nav data/` DSFs, `objects/` distant blocks and custom models, `cityscene/` the job for re-importing), linked into Custom Scenery on install |

## What install does

- Creates a folder link in `Custom Scenery/` pointing to `build/<pack>/` (a symlink if allowed, otherwise a
  junction, which any user can create); nothing is copied
- Backs up `scenery_packs.ini` with a timestamp, then inserts the pack's line just before `*GLOBAL_AIRPORTS*`,
  leaving every other line untouched. Exclusions only affect packs listed below, so the pack has to sit above
  third-party autogen such as simHeaven
- Refuses to install or uninstall while X-Plane is running (it rewrites the ini when it quits)

## Known limitations

- OSM only: buildings without `height` or `building:levels` get the default height (adjustable in the UI).
  The result panel shows how many buildings had OSM height data
- X-Plane 12's generic facades have no single-storey style, so 1–2 storey buildings are drawn with at least
  2 floors
- Only default buildings are excluded; default roads, trees and ground cover stay
- Not yet checked in the sim for a real area

## Building a release

```
pip install pyinstaller
powershell -ExecutionPolicy Bypass -File packaging/build_release.ps1
```

This writes `dist/CityScene-<version>-windows-x64.zip`. Pushing a `v*` tag runs the same build on GitHub Actions
and attaches the zip to a new release.

## Tests

```
python -m pytest -q
```

The end-to-end test runs the pipeline on synthetic data without network access and needs DSFTool (skipped otherwise).

## License

Copyright (C) 2026 Hanyi Zhang

This program is free software: you can redistribute it and/or modify it under the terms of the
GNU General Public License as published by the Free Software Foundation, either version 3 of the License,
or (at your option) any later version. See [LICENSE](LICENSE).

The license covers this tool's source code only. Scenery it generates contains OpenStreetMap data (ODbL, see
below) and references the X-Plane 12 default library, neither of which is covered by the GPL.

## Data and attribution

- Buildings: © OpenStreetMap contributors, ODbL 1.0. Keep the README.txt attribution inside any scenery you publish
- Facades: X-Plane 12 default library (Laminar Research); users need no extra downloads
