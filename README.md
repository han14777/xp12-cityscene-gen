# xp12-cityscene-gen

Draw an area on a map and generate X-Plane 12 city building scenery in one go:
OpenStreetMap building outlines and heights → cleaning → X-Plane 12 default facades → DSF (which also hides the
default autogen buildings inside the area) → linked into Custom Scenery.

The pipeline is a generalised version of the one built for a Melbourne CBD scenery (melbourne-cbd-xp12).
City-specific data and hand-made landmark models were left out, so it works for any city.

## Requirements

- Python 3.11+: `pip install -e ".[dev]"`
- X-Plane 12 (its location is read automatically from `%LOCALAPPDATA%\x-plane_install_12.txt`)
- `DSFTool.exe` from Laminar's [XPTools](https://developer.x-plane.com/tools/xptools/); set its path under
  "Local settings" in the UI (saved to `config/local.yaml`, which is not committed)

## Browser UI

```
python -m cityscene gui        # or double-click start_gui.bat
```

The UI is in English by default; switch with the EN / 中文 buttons next to the title (remembered by the browser).

1. Search for a city, then draw rectangles or polygons with the tools at the top left of the map (several are fine)
2. Enter a job name and click "Save area and generate"; progress and logs appear as it runs
3. When done, buildings are shown on the map coloured by height; hover to see the height source and facade style
4. Quit X-Plane and click "Install to X-Plane"

## Command line

```
python -m cityscene new sydney_cbd --bbox 151.200,-33.875,151.215,-33.860
python -m cityscene build sydney_cbd            # fetch → clean → classify → build_dsf
python -m cityscene build sydney_cbd --steps clean,classify,build_dsf   # after changing settings, no re-download
python -m cityscene install sydney_cbd
python -m cityscene uninstall sydney_cbd
python -m cityscene list
```

`--zone area.geojson` works too (e.g. drawn and exported from geojson.io).

## Pipeline

| Step | What it does |
|------|--------------|
| fetch | Downloads `building`, `building:part` and `highway` from Overpass in grid chunks, cached per job; chunks already covering the area are reused |
| clean | Assembles outlines and relations, keeps buildings whose centroid is in the area, splits `building:part`s, fills heights (`height` → `building:levels` × level height → default), cuts or drops buildings sitting on roads, removes duplicates and overlaps (tallest wins) |
| classify | Sorts buildings into high / mid / low rise and heritage, and picks a default facade whose floor range fits |
| build_dsf | Writes one DSF per 1° tile with rectangle exclusions for objects and facades, compiles with DSFTool, then decompiles to check nothing was dropped |

## Files

| Path | Contents |
|------|----------|
| `config/settings.yaml` | Global defaults: height rules, cleaning thresholds, facade list, exclusion types |
| `config/local.yaml` | Machine paths (X-Plane, DSFTool), not committed |
| `jobs/<job>/` | `job.json`, `zone.geojson`, `raw/` (Overpass cache), `processed/` (intermediate results and reports), `build.log` |
| `build/<pack>/` | The generated scenery pack, linked into Custom Scenery on install |

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
