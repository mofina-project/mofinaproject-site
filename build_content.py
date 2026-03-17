import os
import json
import html
import markdown

CONTENT_DIR = "content"
STORY_DIR = "story"
IDOBATA_DIR = "idobata"


def normalize_text(text):
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    return text


def parse_legacy_meta(text):
    """
    旧形式:
    title:
    date:
    description:
    tags:

    ---

    本文
    """
    title = ""
    date = ""
    description = ""
    tags = ""
    body = text

    parts = text.split("\n---\n", 1)
    if len(parts) != 2:
        return None

    meta_part, body_part = parts
    meta_lines = [line.strip() for line in meta_part.splitlines() if line.strip()]
    if not meta_lines:
        return None

    found_meta = False

    for line in meta_lines:
        if ":" not in line:
            continue
        key, val = line.split(":", 1)
        key = key.strip().lower()
        val = val.strip()

        if key == "title":
            title = val
            found_meta = True
        elif key == "date":
            date = val
            found_meta = True
        elif key == "description":
            description = val
            found_meta = True
        elif key == "tags":
            tags = val
            found_meta = True

    if not found_meta:
        return None

    body = body_part.lstrip("\n")
    return {
        "title": title,
        "date": date,
        "description": description,
        "tags": tags,
        "body": body,
    }


def parse_front_matter(text):
    """
    新形式:
    ---
    title:
    date:
    description:
    tags:
    ---

    本文
    """
    title = ""
    date = ""
    description = ""
    tags = ""
    body = text

    if not text.startswith("---\n"):
        return None

    parts = text.split("\n---\n", 1)
    if len(parts) != 2:
        return None

    meta_part, body_part = parts
    meta_lines = meta_part.splitlines()[1:]

    found_meta = False

    for line in meta_lines:
        line = line.strip()
        if not line or ":" not in line:
            continue

        key, val = line.split(":", 1)
        key = key.strip().lower()
        val = val.strip()

        if key == "title":
            title = val
            found_meta = True
        elif key == "date":
            date = val
            found_meta = True
        elif key == "description":
            description = val
            found_meta = True
        elif key == "tags":
            tags = val
            found_meta = True

    if not found_meta:
        return None

    body = body_part.lstrip("\n")
    return {
        "title": title,
        "date": date,
        "description": description,
        "tags": tags,
        "body": body,
    }


def extract_first_text_line(body):
    for line in body.splitlines():
        s = line.strip()
        if not s:
            continue
        if s.startswith("![](") or s.startswith("!["):
            continue
        if s == "---":
            continue
        return s
    return ""


def parse_md(text, filename=""):
    """
    editor_server.py の旧テンプレート / 新テンプレートの両対応
    """
    text = normalize_text(text)

    data = parse_front_matter(text)
    if data is None:
        data = parse_legacy_meta(text)

    if data is None:
        data = {
            "title": "",
            "date": "",
            "description": "",
            "tags": "",
            "body": text,
        }

    title = (data.get("title") or "").strip()
    date = (data.get("date") or "").strip()
    description = (data.get("description") or "").strip()
    tags = (data.get("tags") or "").strip()
    body = (data.get("body") or "").strip()

    if not title:
        title = os.path.splitext(filename)[0] if filename else "タイトルなし"

    if not description:
        description = extract_first_text_line(body) or "本文を読む"

    return title, date, description, tags, body


def render_body(body):
    return markdown.markdown(
        body,
        extensions=[
            "extra",
            "sane_lists",
            "fenced_code",
            "tables",
            "nl2br",
        ],
        output_format="html5",
    )


def article_template(section, title, date, description, tags, body_html):
    if section == "story":
        section_label = "Story"
        section_url = "/story/"
    else:
        section_label = "井戸端会議"
        section_url = "/idobata/"

    safe_title = html.escape(title)
    safe_description = html.escape(description)
    safe_date = html.escape(date)
    safe_tags = html.escape(tags)

    meta_line_parts = []
    if date:
        meta_line_parts.append(f'<span class="meta-item">date: {safe_date}</span>')
    if tags:
        meta_line_parts.append(f'<span class="meta-item">tags: {safe_tags}</span>')

    meta_line = ""
    if meta_line_parts:
        meta_line = f'<div class="meta">{" ".join(meta_line_parts)}</div>'

    return f"""<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="{safe_description}">
<title>{safe_title} | Mofina Project</title>
<style>
:root{{
  --bg:#081710;
  --bg2:#0d2218;
  --panel:rgba(255,255,255,.04);
  --line:rgba(255,255,255,.10);
  --text:rgba(255,255,255,.94);
  --muted:rgba(255,255,255,.72);
  --accent:#d7ef92;
}}
*{{box-sizing:border-box}}
html,body{{margin:0;padding:0}}
body{{
  font-family:ui-sans-serif,system-ui,-apple-system,"Hiragino Sans","Noto Sans JP","Segoe UI",Arial,sans-serif;
  color:var(--text);
  background:
    radial-gradient(1200px 700px at 50% 15%,rgba(255,255,255,.06),rgba(255,255,255,0)55%),
    linear-gradient(180deg,var(--bg2),var(--bg));
  line-height:1.9;
}}
.site-header{{
  position:sticky;
  top:0;
  z-index:20;
  backdrop-filter:blur(10px);
  background:rgba(5,16,11,.72);
  border-bottom:1px solid var(--line);
}}
.site-header-inner{{
  max-width:980px;
  margin:0 auto;
  padding:14px 18px;
  display:flex;
  gap:10px;
  flex-wrap:wrap;
  align-items:center;
}}
.site-header a{{
  color:var(--text);
  text-decoration:none;
  border:1px solid var(--line);
  background:rgba(255,255,255,.04);
  padding:8px 12px;
  border-radius:999px;
}}
.site-header a:hover{{background:rgba(255,255,255,.08)}}
.container{{
  max-width:980px;
  margin:0 auto;
  padding:28px 18px 64px;
}}
.article{{
  background:rgba(255,255,255,.03);
  border:1px solid var(--line);
  border-radius:24px;
  padding:24px 20px;
  box-shadow:0 20px 50px rgba(0,0,0,.18);
}}
.eyebrow{{
  color:var(--accent);
  font-size:13px;
  margin-bottom:8px;
}}
h1{{
  margin:0 0 12px;
  font-size:clamp(28px,4vw,42px);
  line-height:1.25;
}}
.desc{{
  color:var(--muted);
  margin:0 0 14px;
}}
.meta{{
  display:flex;
  gap:14px;
  flex-wrap:wrap;
  color:var(--muted);
  font-size:14px;
  padding-bottom:16px;
  margin-bottom:18px;
  border-bottom:1px solid var(--line);
}}
.content img{{
  max-width:100%;
  height:auto;
  border-radius:18px;
  display:block;
  margin:18px auto;
}}
.content p,
.content ul,
.content ol,
.content blockquote,
.content pre,
.content table{{
  margin:0 0 1em;
}}
.content h1,.content h2,.content h3,.content h4{{
  line-height:1.4;
  margin:1.4em 0 .7em;
}}
.content a{{color:#cfe75d}}
.content code{{
  background:rgba(255,255,255,.08);
  padding:.15em .4em;
  border-radius:8px;
}}
.content pre{{
  overflow:auto;
  padding:14px;
  border-radius:16px;
  background:rgba(0,0,0,.24);
  border:1px solid var(--line);
}}
.footer-nav{{
  margin-top:22px;
  display:flex;
  gap:10px;
  flex-wrap:wrap;
}}
.footer-nav a{{
  color:var(--text);
  text-decoration:none;
  border:1px solid var(--line);
  background:rgba(255,255,255,.04);
  padding:10px 14px;
  border-radius:999px;
}}
.footer-nav a:hover{{background:rgba(255,255,255,.08)}}
.site-footer{{
  max-width:980px;
  margin:0 auto;
  padding:0 18px 26px;
  color:var(--muted);
  font-size:13px;
}}
</style>
</head>
<body>
<header class="site-header">
  <div class="site-header-inner">
    <a href="/">森の入口へ戻る</a>
    <a href="{section_url}">{section_label} 一覧へ戻る</a>
  </div>
</header>

<main class="container">
  <article class="article">
    <div class="eyebrow">{section_label}</div>
    <h1>{safe_title}</h1>
    <p class="desc">{safe_description}</p>
    {meta_line}
    <div class="content">
      {body_html}
    </div>
    <div class="footer-nav">
      <a href="{section_url}">{section_label} 一覧へ戻る</a>
      <a href="/">森の入口へ戻る</a>
    </div>
  </article>
</main>

<footer class="site-footer">© Mofina Project</footer>
</body>
</html>
"""


def build_section(section, outdir):
    items = []
    src = os.path.join(CONTENT_DIR, section)

    os.makedirs(outdir, exist_ok=True)

    if not os.path.exists(src):
        print(f"skip: {src} がありません")
        return

    files = sorted(os.listdir(src))
    index = 1

    for filename in files:
        if not filename.endswith(".md"):
            continue

        path = os.path.join(src, filename)

        with open(path, "r", encoding="utf-8") as mdfile:
            text = mdfile.read()

        title, date, description, tags, body = parse_md(text, filename=filename)
        body_html = render_body(body)

        if section == "story":
            outfile = f"story{index:02}.html"
            json_name = "story.json"
        else:
            outfile = f"talk{index:02}.html"
            json_name = "idobata.json"

        outpath = os.path.join(outdir, outfile)

        page_html = article_template(
            section=section,
            title=title,
            date=date,
            description=description,
            tags=tags,
            body_html=body_html,
        )

        with open(outpath, "w", encoding="utf-8") as fhtml:
            fhtml.write(page_html)

        items.append({
            "title": title,
            "date": date,
            "description": description,
            "url": f"/{section}/{outfile}"
        })

        index += 1

    jsonfile = os.path.join(outdir, json_name)

    with open(jsonfile, "w", encoding="utf-8") as jf:
        json.dump(items, jf, ensure_ascii=False, indent=2)


build_section("story", STORY_DIR)
build_section("idobata", IDOBATA_DIR)

print("build complete")