"""Command line: python -m cityscene <command>

  gui                                    start the browser map UI (default http://127.0.0.1:8765)
  new <name> (--bbox W,S,E,N | --zone file.geojson) [--scenery pack] [--default-height 12]
  build <name> [--steps fetch,clean,...] [--force-fetch]
  install <name> / uninstall <name>
  list
"""

import argparse
import json
import sys

from shapely.geometry import box, mapping

from cityscene import install as installer
from cityscene import pipeline
from cityscene.config import Job, list_jobs, load_settings


def parse_bbox(text: str) -> dict:
    west, south, east, north = (float(v) for v in text.split(","))
    if not (west < east and south < north):
        raise argparse.ArgumentTypeError("--bbox 应为 西,南,东,北（经度,纬度,经度,纬度）")
    return mapping(box(west, south, east, north))


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(prog="cityscene", description="X-Plane 12 城市地景快速生成")
    sub = parser.add_subparsers(dest="command", required=True)

    p = sub.add_parser("gui", help="启动浏览器地图界面")
    p.add_argument("--port", type=int, default=8765)
    p.add_argument("--no-browser", action="store_true")

    p = sub.add_parser("new", help="新建任务（选区）")
    p.add_argument("name")
    group = p.add_mutually_exclusive_group(required=True)
    group.add_argument("--bbox", type=parse_bbox, help="西,南,东,北")
    group.add_argument("--zone", help="选区 GeoJSON 文件")
    p.add_argument("--scenery", help="地景包名（默认 CityScene_<名称>）")
    p.add_argument("--default-height", type=float, help="无高度数据时的默认高度（米）")
    p.add_argument("--overwrite", action="store_true")

    p = sub.add_parser("build", help="运行管线")
    p.add_argument("name")
    p.add_argument("--steps", help=f"逗号分隔，默认全部：{','.join(pipeline.STEPS)}")
    p.add_argument("--force-fetch", action="store_true", help="忽略缓存重新下载 OSM")

    for cmd in ("install", "uninstall"):
        sub.add_parser(cmd).add_argument("name")
    sub.add_parser("list", help="列出任务")

    args = parser.parse_args(argv)
    settings = load_settings()

    try:
        if args.command == "gui":
            from cityscene.gui.server import serve
            serve(args.port, open_browser=not args.no_browser)
        elif args.command == "new":
            if args.zone:
                with open(args.zone, encoding="utf-8") as f:
                    zone = json.load(f)
            else:
                zone = args.bbox
            options = {"heights": {"default_height_m": args.default_height}} if args.default_height else {}
            job = Job.create(args.name, zone, settings, args.scenery, options, overwrite=args.overwrite)
            print(f"已创建任务 {job.name}：{job.root}")
        elif args.command == "build":
            steps = args.steps.split(",") if args.steps else None
            pipeline.run(Job.open(args.name, settings), settings, steps, force_fetch=args.force_fetch)
        elif args.command == "install":
            installer.install(Job.open(args.name, settings), settings)
        elif args.command == "uninstall":
            installer.uninstall(Job.open(args.name, settings), settings)
        elif args.command == "list":
            for name in list_jobs(settings):
                job = Job.open(name, settings)
                print(f"{name}\t{job.scenery_name}\t{'已生成' if (job.build_dir(settings) / 'Earth nav data').is_dir() else '未生成'}")
    except (RuntimeError, ValueError, FileNotFoundError, FileExistsError) as exc:
        print(f"错误：{exc}", file=sys.stderr)
        return 1
    return 0
