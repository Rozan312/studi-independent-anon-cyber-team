"""
Bingkai browser/ponsel (PNG transparan) dan kolase banner dari screenshot 2x hasil capture.mjs.
Render lewat Chrome headless; butuh Python 3 + Pillow.

  python3 scripts/showcase/compose.py docs/showcase/screens docs/showcase
"""
import os, subprocess, sys, tempfile
from pathlib import Path
from PIL import Image

SHOTS = Path(sys.argv[1]).resolve()
ROOT = Path(sys.argv[2]).resolve()
FRAMED = ROOT / "framed"; BANNER = ROOT / "banner"
for folder in (FRAMED, BANNER): folder.mkdir(parents=True, exist_ok=True)
WORK = Path(tempfile.mkdtemp(prefix="act-showcase-"))
CHROME = os.environ.get("CHROME_PATH", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")

BASE_CSS = """
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:transparent;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
.browser{width:1440px;border-radius:14px;overflow:hidden;background:#fff;box-shadow:0 30px 60px -12px rgba(8,30,44,.28),0 0 0 1px rgba(8,30,44,.10)}
.browser.night{background:#11181e;box-shadow:0 30px 60px -12px rgba(0,0,0,.5),0 0 0 1px rgba(255,255,255,.08)}
.bar{height:44px;display:flex;align-items:center;gap:8px;padding:0 16px;background:#eef3f5;border-bottom:1px solid #dbe5e9;position:relative}
.night .bar{background:#161f26;border-bottom-color:#25313a}
.dot{width:12px;height:12px;border-radius:50%}
.title{position:absolute;left:50%;transform:translateX(-50%);height:28px;min-width:420px;padding:0 16px;border-radius:8px;background:#fff;border:1px solid #d6e1e6;display:flex;align-items:center;justify-content:center;gap:8px;font-size:13px;color:#3d4c56}
.night .title{background:#0d1418;border-color:#2a3640;color:#a9b8c1}
.browser img{display:block;width:1440px;height:900px}
.phone{width:418px;height:872px;padding:14px;border-radius:60px;background:#0b1013;box-shadow:0 30px 60px -12px rgba(8,30,44,.35),inset 0 0 0 2px #2a3238;position:relative}
.screen{width:390px;height:844px;border-radius:46px;overflow:hidden;display:flex;flex-direction:column}
.status{height:50px;flex:none;display:flex;align-items:center;justify-content:space-between;padding:6px 30px 0 40px;font-size:16px;font-weight:600;letter-spacing:-.01em}
.status svg{display:block}
.phone img{display:block;width:390px;height:794px;object-fit:cover;object-position:top}
.island{position:absolute;top:25px;left:50%;transform:translateX(-50%);width:118px;height:34px;border-radius:20px;background:#000}
"""

def browser(img, title, night):
    lock = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>'
    return f'''<div class="browser {'night' if night else ''}"><div class="bar"><span class="dot" style="background:#ff5f57"></span><span class="dot" style="background:#febc2e"></span><span class="dot" style="background:#28c840"></span><span class="title">{lock}{title}</span></div><img src="{img.as_uri()}"></div>'''

def phone(img):
    # Status bar ponsel memakai warna baris atas screenshot agar menyatu dengan bar aplikasi.
    r, g, b = Image.open(img).convert("RGB").getpixel((20, 4))
    ink = "#0b1013" if (0.299 * r + 0.587 * g + 0.114 * b) > 140 else "#f2f6f8"
    icons = (f'<span style="display:flex;gap:6px;align-items:center">'
             f'<svg width="18" height="12" viewBox="0 0 18 12" fill="{ink}"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>'
             f'<svg width="16" height="12" viewBox="0 0 16 12" fill="{ink}"><path d="M8 2.2c2.3 0 4.4.9 6 2.4l1.2-1.3A10.3 10.3 0 0 0 8 .4C5.2.4 2.6 1.5.8 3.3L2 4.6a8.5 8.5 0 0 1 6-2.4Zm0 3.6c1.3 0 2.5.5 3.4 1.3l1.2-1.3A6.7 6.7 0 0 0 8 4c-1.8 0-3.4.7-4.6 1.8l1.2 1.3c.9-.8 2.1-1.3 3.4-1.3ZM8 9.4l1.9-2a2.8 2.8 0 0 0-3.8 0l1.9 2Z"/></svg>'
             f'<svg width="27" height="13" viewBox="0 0 27 13" fill="none"><rect x=".5" y=".5" width="23" height="12" rx="3.5" stroke="{ink}" opacity=".4"/><rect x="2" y="2" width="18" height="9" rx="2" fill="{ink}"/><path d="M25 4.5v4c.8-.3 1.3-1.1 1.3-2s-.5-1.7-1.3-2Z" fill="{ink}" opacity=".5"/></svg></span>')
    status = f'<div class="status" style="background:rgb({r},{g},{b});color:{ink}"><span>9:41</span>{icons}</div>'
    return f'<div class="phone"><div class="screen">{status}<img src="{img.as_uri()}"></div><span class="island"></span></div>'

def render(out, body, width, height, extra_css=""):
    name = out.stem
    html = WORK / f"{name}.html"
    html.write_text(f"<!doctype html><html><head><meta charset='utf-8'><style>{BASE_CSS}{extra_css}</style></head><body>{body}</body></html>")
    subprocess.run([CHROME, "--headless=new", "--hide-scrollbars", "--force-device-scale-factor=2", "--default-background-color=00000000",
                    f"--window-size={width},{height}", f"--screenshot={out}", "--allow-file-access-from-files", html.as_uri()],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print("saved", out.relative_to(ROOT))

PAD = 60
TITLES = {"home": "Anon Cyber Team", "dashboard": "Dashboard · Anon Cyber Team", "learning-paths": "Learning paths · Anon Cyber Team",
          "path-detail": "Web Security Fundamentals · Anon Cyber Team", "room": "Broken Access Control Basics · Anon Cyber Team",
          "quiz": "Quiz · Anon Cyber Team", "progress": "Progress · Anon Cyber Team", "leaderboard": "Leaderboard · Anon Cyber Team",
          "profile": "Profile · Anon Cyber Team", "lab": "Lab · Anon Cyber Team"}

for shot in sorted(SHOTS.glob("desktop-*.png")):
    if shot.stem.endswith("-full"): continue
    night = "-night-" in shot.stem
    page = shot.stem.split("-", 2)[2]
    render(FRAMED / shot.name, f'<div style="padding:{PAD}px">{browser(shot, TITLES.get(page, "Anon Cyber Team"), night)}</div>', 1440 + PAD * 2, 944 + PAD * 2)

for shot in sorted(SHOTS.glob("mobile-*.png")):
    render(FRAMED / shot.name, f'<div style="padding:{PAD}px">{phone(shot)}</div>', 418 + PAD * 2, 872 + PAD * 2)

# Kolase banner 1600x840 (3200x1680 px): browser besar + ponsel menimpa di kanan bawah, latar warna merek.
COLLAGE_CSS = """
.stage{width:1600px;height:840px;position:relative;overflow:hidden}
.stage.light{background:radial-gradient(rgba(0,108,138,.13) 1px,transparent 1.3px) 0 0/18px 18px,linear-gradient(135deg,#d9f1f8 0%,#eef4f7 45%,#e9e6f7 100%)}
.stage.night{background:radial-gradient(rgba(96,212,246,.10) 1px,transparent 1.3px) 0 0/18px 18px,linear-gradient(135deg,#0b2430 0%,#0f171d 50%,#1b1630 100%)}
.desk{position:absolute;left:90px;top:80px;transform:scale(.82);transform-origin:top left}
.mob{position:absolute;right:110px;top:150px;transform:scale(.78);transform-origin:top right}
"""

def collage(name, tone, desk_shot, desk_night, phones):
    missing = [shot for shot in [desk_shot, *phones] if not (SHOTS / f"{shot}.png").exists()]
    if missing:
        print(f"skip banner/{name}.png: missing {', '.join(missing)}")
        return
    page = desk_shot.split("-", 2)[2]
    body = f'<div class="stage {tone}"><div class="desk">{browser(SHOTS / (desk_shot + ".png"), TITLES[page], desk_night)}</div>'
    body += f'<div class="mob">{phone(SHOTS / (phones[0] + ".png"))}</div></div>'
    render(BANNER / f"{name}.png", body, 1600, 840, COLLAGE_CSS)

collage("banner-collage-light", "light", "desktop-light-dashboard", False, ["mobile-night-dashboard"])
collage("banner-collage-night", "night", "desktop-night-dashboard", True, ["mobile-light-progress"])
collage("banner-collage-progress", "light", "desktop-light-progress", False, ["mobile-light-room"])
