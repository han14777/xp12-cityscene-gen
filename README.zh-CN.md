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
拖动侧栏与地图之间的分隔条可调整宽度（双击恢复默认，‹ 按钮可隐藏侧栏）；每个步骤点标题即可折叠。
所有需要路径的地方都有"浏览…"按钮，会打开系统的文件选择窗口，也可以手动填写。
在任务外选择的模型会连同贴图一起复制到任务的 `models/` 文件夹。

侧栏一开始有三个选项：**新建项目**、**打开项目**（本副本里之前做过的）和**导入地景包**（见下文）。新建项目时：

1. 搜索城市，用地图左上角的工具画矩形或多边形（可以画多块）
2. 填写任务名，点击"保存选区并生成"，运行时显示进度和日志
3. 完成后地图上按高度着色显示建筑，鼠标悬停可查看高度来源和 facade 风格
4. 退出 X-Plane，点击"安装到 X-Plane"

## 导入本工具生成的地景包

每个生成的地景包都在 `<地景包>/cityscene/` 里带着自己的任务（选区、设置、建筑修改、清洗后的 OSM 建筑），
所以地景包可以重新变回任务：开始时选"导入地景包"（会列出 Custom Scenery 和 build 文件夹里找到的包，
已导入过的会直接给出"打开"），或运行 `python -m cityscene import <地景包文件夹>`。导入时复制一份，原包不变。
导入后可以直接编辑建筑，也可以勾选"重新下载 OSM"再生成，更新数据。

- 如果地景包是本工具另一个副本（比如 release 文件夹）生成的，会把整个任务一起带过来，包括已下载的 OSM 数据
- 加入这个功能之前生成的旧版地景包，会从 DSF 排除区还原选区；编辑前要先生成一次，下载 OSM
- 如果这个包是从另一个副本安装的，先在那边卸载，再从这边安装

## 编辑建筑与自定义模型

生成后在地图上点一栋楼，会打开"编辑建筑"：

- **保留**：可以改高度（最高部分的高度，其他部分按同样比例缩放），或换外墙风格
- **删除**
- **替换为我的模型**：在楼的中心放一个 OBJ，可调朝向和向东 / 向北偏移

修改按 OSM 建筑编号保存在 `jobs/<任务>/overrides.json`，重新下载 OSM 或重新生成都不会丢。
点"应用修改"重新生成（只跑 classify 和 build_dsf，不重新下载）。

自定义模型：把 `.obj` 和贴图放进 `jobs/<任务>/models/`（可以分子文件夹），填相对这个文件夹的路径，
例如 `eureka/eureka.obj`；整个文件夹会被复制进地景包。也可以填 X-Plane 库路径（如 `lib/...`）。
被替换的楼不再生成 facade 和远景体块。

在 Blender 里建模：点"下载 Blender 参考模型"（或 `python -m cityscene reference <任务> way/123`），
用"文件 → 导入 → Wavefront (.obj)"按默认坐标轴导入。它是这栋楼以放置点为原点的体块，在上面建模，
用 [XPlane2Blender](https://github.com/X-Plane/XPlane2Blender) 导出，朝向 0、偏移 0 就能和地图对齐。
也可以用 SketchUp、AC3D 的导出插件，或用代码生成模型。

## 命令行

```
python -m cityscene new sydney_cbd --bbox 151.200,-33.875,151.215,-33.860 --render-distance 30
python -m cityscene build sydney_cbd            # fetch → clean → classify → build_dsf
python -m cityscene build sydney_cbd --steps clean,classify,build_dsf   # 改了设置后重跑，不重新下载
python -m cityscene install sydney_cbd
python -m cityscene uninstall sydney_cbd
python -m cityscene list
python -m cityscene reference sydney_cbd way/123   # 导出一栋楼给 Blender 当参考
python -m cityscene import "X-Plane 12/Custom Scenery/CityScene_sydney_cbd"   # 地景包 → 任务
```

也可以用 `--zone area.geojson` 指定选区（例如在 geojson.io 画好后导出）。

## 渲染距离

X-Plane 12 自带 facade 只显示到 8–18 公里（由各 facade 自身设定）。更远处由合并的低模体块（带简单的窗户贴图）接替，
一直显示到界面里选的渲染距离（默认 30 公里；命令行用 `--render-distance`，设置文件为 `dsf.render_distance_km`）。
设得比 facade 自身距离还小，并不会让 facade 提前消失。距离越大，帧率开销越大。

## 处理流程

| 步骤 | 做什么 |
|------|--------|
| fetch | 从 Overpass 按网格分块下载 `building`、`building:part` 和 `highway`，按任务缓存；已覆盖选区的块直接复用 |
| clean | 组装轮廓和关系，只保留质心在选区内的建筑，拆分 `building:part`，补高度（`height` → `building:levels` × 层高 → 默认值），切割或剔除压在路上的建筑，去重并消除重叠（高的优先） |
| classify | 把建筑分为高层 / 中层 / 低层和历史建筑，并选楼层范围合适的默认 facade |
| build_dsf | 每个 1° 瓦片写一个 DSF，用矩形排除区屏蔽默认物件和 facade，用 DSFTool 编译后再反编译，核对没有丢失；并加入简化的远景体块，让建筑一直显示到渲染距离 |

## 文件

| 路径 | 内容 |
|------|------|
| `config/settings.yaml` | 全局默认：高度规则、清洗阈值、facade 列表、排除类型 |
| `config/local.yaml` | 本机路径（X-Plane、DSFTool），不进 git |
| `jobs/<任务>/` | `job.json`、`zone.geojson`、`raw/`（Overpass 缓存）、`processed/`（中间结果和报告）、`overrides.json`（建筑修改）、`models/`（自定义模型）、`build.log` |
| `build/<地景包>/` | 生成的地景包（`Earth nav data/` 中的 DSF，`objects/` 中的远景体块和自定义模型，`cityscene/` 中供重新导入的任务数据），安装时链接到 Custom Scenery |

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
