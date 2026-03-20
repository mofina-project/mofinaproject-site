import os
import json
import html
import markdown
import re

# パス設定
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CONTENT_DIR = os.path.join(BASE_DIR, "content")
STORY_DIR = os.path.join(BASE_DIR, "story")
IDOBATA_DIR = os.path.join(BASE_DIR, "idobata")

def parse_tags(val):
    val = val.strip()
    if not val: return []
    if val.startswith("[") and val.endswith("]"):
        inner = val[1:-1].strip()
        return [x.strip().strip('"').strip("'") for x in inner.split(",") if x.strip()]
    return [x.strip() for x in val.split(",") if x.strip()]

def parse_md(text, filename=""):
    title, date, description, tags = "", "", "", []
    body = text
    # フロントマター解析（新・旧両対応）
    match = re.match(r'^---\s*\n(.*?)\n---\s*\n(.*)', text, re.DOTALL)
    if not match: match = re.match(r'^(.*?)\n---\s*\n(.*)', text, re.DOTALL)
    
    if match:
        header, body = match.group(1), match.group(2)
        for line in header.split('\n'):
            if ':' in line:
                k, v = line.split(':', 1)
                k, v = k.strip().lower(), v.strip()
                if k == "title": title = v
                elif k == "date": date = v
                elif k == "description": description = v
                elif k == "tags": tags = parse_tags(v)
    
    if not title: title = filename.replace(".md", "") or "無題"
    return title, date, description, tags, body

def build_section(section, outdir):
    src = os.path.join(CONTENT_DIR, section)
    if not os.path.exists(src): return
    os.makedirs(outdir, exist_ok=True)
    
    items = []
    files = sorted([f for f in os.listdir(src) if f.endswith(".md")])
    
    for i, md_name in enumerate(files, 1):
        with open(os.path.join(src, md_name), "r", encoding="utf-8") as f:
            title, date, description, tags, body = parse_md(f.read(), md_name)
        
        body_html = markdown.markdown(body, extensions=["extra", "nl2br"])
        outfile = f"{'story' if section=='story' else 'talk'}{i:02}.html"
        
        # 記事HTML出力
        with open(os.path.join(outdir, outfile), "w", encoding="utf-8") as f:
            f.write(f"<!DOCTYPE html><html lang='ja'><head><meta charset='utf-8'><title>{title}</title></head><body>"
                    f"<nav><a href='../index.html'>森の入口</a> | <a href='index.html'>一覧</a></nav>"
                    f"<h1>{title}</h1><p>{date} {tags}</p><hr>{body_html}</body></html>")
        
        items.append({"title": title, "date": date, "description": description, "tags": tags, "url": outfile})

    # JSON出力
    json_name = "story.json" if section == "story" else "idobata.json"
    with open(os.path.join(outdir, json_name), "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    build_section("story", STORY_DIR)
    build_section("idobata", IDOBATA_DIR)
    print("Build Complete.")