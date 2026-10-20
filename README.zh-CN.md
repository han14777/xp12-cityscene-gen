# xp12-cityscene-gen

[English](README.md) | **简体中文**

在地图上框选一块区域，一键生成 X-Plane 12 城市建筑地景：
OpenStreetMap 建筑轮廓和高度 → 清洗 → X-Plane 12 自带 facade → DSF（同时屏蔽选区内的默认 autogen 建筑）→ 链接到 Custom Scenery。

这套流程由墨尔本 CBD 地景项目（melbourne-cbd-xp12）通用化而来，去掉了城市专属数据和手工地标模型，适用于任何城市。

## 下载（Windows）

不需要安装 Python：从 [Releases](https://github.com/han14777/xp12-cityscene-gen/releases/latest) 下载
`CityScene-<版本>-windows-x64.zip`，解压到任意有写权限的位置，双击 `CityScene.exe`，浏览器会打开地图界面。
首次启动时会从 Laminar Research 官网（files.x-plane.com）下载 DSFTool 到 `tools` 文件夹并校验 SHA-256；
X-Plane 12 的位置会自动识别。任务和生成的地景都保存在解压出来的文件夹里。

本文其余部分介绍从源码运行。

## 运行环境

- Python 3.11+：`pip install -e ".[dev]"`
- X-Plane 12（位置自动从 `%LOCALAPPDATA%\x-plane_install_12.txt` 读取）
- Laminar [XPTools](https://developer.x-plane.com/tools/xptools/) 中的 `DSFTool.exe`：首次使用时自动下载到 `tools/`，
  也可在界面"本机设置"中填写自己的路径（保存到 `config/local.yaml`，不进 git）

## 浏览器界面

```
python -m cityscene gui        # 或双击 start_gui.bat
```

界面默认英文，可用标题旁的 EN / 中文 按钮切换（浏览器会记住选择）。

1. 搜索城市，用地图左上角的工具画矩形或多边形（可以画多块）
2. 填写任务名，点击"保存选区并生成"，运行时显示进度和日志
3. 完成后地图上按高度着色显示建筑，鼠标悬停可查看高度来源和 facade 风格
4. 退出 X-Plane，点击"安装到 X-Plane"

## 命令行

```
python -m cityscene new sydney_cbd --bbox 151.200,-33.875,151.215,-33.860
python -m cityscene build sydney_cbd            # fetch → clean → classify → build_dsf
python -m cityscene build sydney_cbd --steps clean,classify,build_dsf   # 改了设置后重跑，不重新下载
python -m cityscene install sydney_cbd
python -m cityscene uninstall sydney_cbd
python -m cityscene list
```

也可以用 `--zone area.geojson` 指定选区（例如在 geojson.io 画好后导出）。

## 处理流程

| 步骤 | 做什么 |
|------|--------|
| fetch | 从 Overpass 按网格分块下载 `building`、`building:part` 和 `highway`，按任务缓存；已覆盖选区的块直接复用 |
| clean | 组装轮廓和关系，只保留质心在选区内的建筑，拆分 `building:part`，补高度（`height` → `building:levels` × 层高 → 默认值），切割或剔除压在路上的建筑，去重并消除重叠（高的优先） |
| classify | 把建筑分为高层 / 中层 / 低层和历史建筑，并选楼层范围合适的默认 facade |
| build_dsf | 每个 1° 瓦片写一个 DSF，用矩形排除区屏蔽默认物件和 facade，用 DSFTool 编译后再反编译，核对没有丢失 |

## 文件

| 路径 | 内容 |
|------|------|
| `config/settings.yaml` | 全局默认：高度规则、清洗阈值、facade 列表、排除类型 |
| `config/local.yaml` | 本机路径（X-Plane、DSFTool），不进 git |
| `jobs/<任务>/` | `job.json`、`zone.geojson`、`raw/`（Overpass 缓存）、`processed/`（中间结果和报告）、`build.log` |
| `build/<地景包>/` | 生成的地景包，安装时链接到 Custom Scenery |

## 安装做了什么

- 在 `Custom Scenery/` 中创建指向 `build/<地景包>/` 的目录链接（允许时用符号链接，否则用任何用户都能创建的 junction），不复制文件
- 带时间戳备份 `scenery_packs.ini`，然后把本包一行插在 `*GLOBAL_AIRPORTS*` 之前，其他行不动。
  排除区只对排在下面的包生效，所以本包必须排在 simHeaven 等第三方 autogen 之上
- X-Plane 运行时拒绝安装或卸载（它退出时会重写 ini）

## 已知局限

- 只用 OSM：没有 `height` 或 `building:levels` 的建筑使用默认高度（可在界面调整）。结果面板会显示有 OSM 高度数据的建筑比例
- X-Plane 12 的 generic facade 没有单层款式，1–2 层的建筑至少画成 2 层
- 只排除默认建筑；默认道路、树木和地表覆盖保留
- 尚未用真实区域在模拟器中检查

## 打包发行版

```
pip install pyinstaller
powershell -ExecutionPolicy Bypass -File packaging/build_release.ps1
```

生成 `dist/CityScene-<版本>-windows-x64.zip`。推送 `v*` 标签时，GitHub Actions 会执行同样的打包并把 zip 附到新的 Release。

## 测试

```
python -m pytest -q
```

端到端测试用构造数据运行整个流程，不联网，需要 DSFTool（没有则跳过）。

## 许可证

Copyright (C) 2026 Hanyi Zhang

本程序是自由软件：你可以依据自由软件基金会发布的 GNU 通用公共许可证第 3 版或（由你选择）任何更新版本，
重新分发和/或修改本程序。详见 [LICENSE](LICENSE)（以英文原文为准）。

许可证只适用于本工具的源代码。生成的地景包含 OpenStreetMap 数据（ODbL，见下文）并引用 X-Plane 12 自带库，二者都不受 GPL 约束。

## 数据与署名

- 建筑：© OpenStreetMap 贡献者，ODbL 1.0。发布地景时请保留包内 README.txt 中的署名
- Facade：X-Plane 12 自带库（Laminar Research），用户无需额外下载
