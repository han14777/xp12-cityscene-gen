# PyInstaller spec for the Windows release: python -m PyInstaller packaging/cityscene.spec
# Produces dist/CityScene/ (CityScene.exe plus its libraries); see packaging/build_release.ps1

from pathlib import Path

from PyInstaller.utils.hooks import collect_data_files

root = Path(SPECPATH).parent

a = Analysis(
    [str(root / "packaging" / "launcher.py")],
    pathex=[str(root)],
    datas=[
        (str(root / "cityscene" / "gui" / "static"), "cityscene/gui/static"),
        (str(root / "config" / "settings.yaml"), "config"),
        *collect_data_files("pyproj"),
    ],
    hiddenimports=[],
    excludes=["tkinter", "pytest"],
)
pyz = PYZ(a.pure)
exe = EXE(pyz, a.scripts, [], exclude_binaries=True, name="CityScene", console=True)
coll = COLLECT(exe, a.binaries, a.datas, name="CityScene")
