import os
import json
import markdown

CONTENT_DIR = "content"
STORY_DIR = "story"
IDOBATA_DIR = "idobata"


def parse_md(text):
    """
    front matter 対応
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
    body = text

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

    # fallback
    if not title:
        title = "タイトルなし"
    if not description:
        description = "本文を読む"

    return title, date, description, body


def build_section(section, outdir):
    items = []
    src = os.path.join(CONTENT_DIR, section)

    if not os.path.exists(src):
        print(f"skip: {src} がありません")
        return

    files = sorted(os.listdir(src))
    index = 1

    for f in files:
        if not f.endswith(".md"):
            continue

        path = os.path.join(src, f)

        with open(path, "r", encoding="utf-8") as mdfile:
            text = mdfile.read()

        title, date, description, body = parse_md(text)

        html = markdown.markdown(body)

        if section == "story":
            outfile = f"story{index:02}.html"
            json_name = "story.json"
        else:
            outfile = f"talk{index:02}.html"
            json_name = "idobata.json"

        outpath = os.path.join(outdir, outfile)

        with open(outpath, "w", encoding="utf-8") as fhtml:
            fhtml.write(f"""<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title>
</head>
<body>
{html}
</body>
</html>
""")

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