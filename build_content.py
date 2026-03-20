import os
import json
import html
import markdown

CONTENT_DIR = "content"
STORY_DIR = "story"
IDOBATA_DIR = "idobata"


# =========================
# tags安全パース
# =========================
def parse_tags(val):
    val = val.strip()
    if not val:
        return []

    # tags: [a, b, c]
    if val.startswith("[") and val.endswith("]"):
        inner = val[1:-1].strip()
        if not inner:
            return []
        return [x.strip().strip('"').strip("'") for x in inner.split(",") if x.strip()]

    # tags: a, b, c
    return [x.strip() for x in val.split(",") if x.strip()]


# =========================
# 安全パース（既存互換 + 旧形式対応追加）
# =========================
def parse_md(text, filename=""):
    title = ""
    date = ""
    description = ""
    tags = []
    body = text

    # front matter（新）
    if text.startswith("---"):
        parts = text.split("\n---\n", 1)
        if len(parts) == 2:
            meta, body = parts
            lines = meta.splitlines()[1:]

            for line in lines:
                if ":" not in line:
                    continue
                key, val = line.split(":", 1)
                key = key.strip().lower()
                val = val.strip()

                if key == "title":
                    title = val
                elif key == "date":
                    date = val
                elif key == "description":
                    description = val
                elif key == "tags":
                    tags = parse_tags(val)

    # ===== 追加: 旧形式対応 =====
    else:
        lines_all = text.splitlines()
        meta_lines = []
        body_lines = []
        in_meta = True

        for line in lines_all:
            stripped = line.strip()

            if in_meta:
                if stripped == "---":
                    in_meta = False
                    continue

                if ":" in line:
                    meta_lines.append(line)
                    continue

                if stripped == "":
                    continue

                in_meta = False

            if not in_meta:
                body_lines.append(line)

        if meta_lines:
            for line in meta_lines:
                if ":" not in line:
                    continue
                key, val = line.split(":", 1)
                key = key.strip().lower()
                val = val.strip()

                if key == "title":
                    title = val
                elif key == "date":
                    date = val
                elif key == "description":
                    description = val
                elif key == "tags":
                    tags = parse_tags(val)

            body = "\n".join(body_lines).strip()
    # ===== 追加ここまで =====

    # fallback（旧ロジック維持）
    lines = [line.strip() for line in body.splitlines() if line.strip()]

    if not title:
        if lines and lines[0].startswith("#"):
            title = lines[0].lstrip("#").strip()
        else:
            title = filename.replace(".md", "") if filename else "タイトルなし"

    if not description:
        for line in lines[1:] if len(lines) > 1 else []:
            low = line.lower()
            if line.startswith("#"):
                continue
            # ===== 追加: メタ行除外 =====
            if low.startswith("title:") or low.startswith("date:") or low.startswith("description:") or low.startswith("tags:"):
                continue
            if line.strip() == "---":
                continue
            # ===== 追加ここまで =====
            description = line
            break

    if not description:
        description = "本文を読む"

    return title, date, description, tags, body


# =========================
# build本体（最小変更）
# =========================
def build_section(section, outdir):
    items = []
    src = os.path.join(CONTENT_DIR, section)

    if not os.path.exists(src):
        print(f"skip: {src} がありません")
        return

    os.makedirs(outdir, exist_ok=True)

    files = sorted(os.listdir(src))
    index = 1

    for md_name in files:
        if not md_name.endswith(".md"):
            continue

        path = os.path.join(src, md_name)

        with open(path, "r", encoding="utf-8") as mdfile:
            text = mdfile.read()

        title, date, description, tags, body = parse_md(text, filename=md_name)

        # markdown変換
        body_html = markdown.markdown(
            body,
            extensions=["extra", "sane_lists", "fenced_code", "tables", "nl2br"],
            output_format="html5",
        )

        if section == "story":
            outfile = f"story{index:02}.html"
            json_name = "story.json"
            url = f"/story/{outfile}"
            list_url = "/story/"
            section_label = "おはなし一覧"
        else:
            outfile = f"talk{index:02}.html"
            json_name = "idobata.json"
            url = f"/idobata/{outfile}"
            list_url = "/idobata/"
            section_label = "いどばた一覧"

        outpath = os.path.join(outdir, outfile)

        # 表示用
        safe_title = html.escape(title)
        safe_date = html.escape(date)
        safe_tags = [html.escape(tag) for tag in tags]
        safe_desc = html.escape(description)

        meta_parts = []
        if date:
            meta_parts.append(f'<span class="article-date">{safe_date}</span>')
        if tags:
            tags_html = "".join([f'<span class="article-tag">{tag}</span>' for tag in safe_tags])
            meta_parts.append(f'<span class="article-tags">{tags_html}</span>')

        meta_html = ""
        if meta_parts:
            meta_html = f"""
<div class="article-meta">
  {' '.join(meta_parts)}
</div>
"""

        nav_html = f"""
<nav class="article-nav">
  <a href="javascript:history.back()">← 戻る</a>
  <a href="{list_url}">{section_label}</a>
  <a href="/">森の入口</a>
</nav>
"""

        with open(outpath, "w", encoding="utf-8") as fhtml:
            fhtml.write(f"""<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{safe_title}</title>
<meta name="description" content="{safe_desc}">
<style>
body {{
  font-family: sans-serif;
  line-height: 1.8;
  max-width: 760px;
  margin: 0 auto;
  padding: 24px 16px 48px;
  color: #222;
}}
.article-nav {{
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}}
.article-nav a {{
  text-decoration: none;
}}
.article-title {{
  margin: 0 0 12px;
}}
.article-meta {{
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 24px;
  color: #666;
  font-size: 0.95rem;
}}
.article-tags {{
  display: inline-flex;
  gap: 8px;
  flex-wrap: wrap;
}}
.article-tag {{
  padding: 2px 8px;
  border: 1px solid #ccc;
  border-radius: 999px;
  font-size: 0.9rem;
}}
.article-body img {{
  max-width: 100%;
  height: auto;
}}
.article-footer {{
  margin-top: 40px;
  padding-top: 16px;
  border-top: 1px solid #ddd;
}}
</style>
</head>
<body>
{nav_html}
<article>
  <h1 class="article-title">{safe_title}</h1>
  {meta_html}
  <div class="article-body">
    {body_html}
  </div>
</article>
<div class="article-footer">
  {nav_html}
</div>
</body>
</html>
""")

        items.append({
            "title": title,
            "date": date,
            "description": description,
            "tags": tags,
            "url": url
        })

        index += 1

    jsonfile = os.path.join(outdir, json_name)

    with open(jsonfile, "w", encoding="utf-8") as jf:
        json.dump(items, jf, ensure_ascii=False, indent=2)


# =========================
# 実行
# =========================
build_section("story", STORY_DIR)
build_section("idobata", IDOBATA_DIR)

print("build complete")