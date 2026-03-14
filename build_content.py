import os
import json
import markdown

CONTENT_DIR = "content"
STORY_DIR = "story"
IDOBATA_DIR = "idobata"


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

        lines = [line.strip() for line in text.splitlines() if line.strip()]

        title = f.replace(".md", "")
        date = ""
        description = "本文を読む"

        if lines:
            if lines[0].startswith("#"):
                title = lines[0].lstrip("#").strip()

        for line in lines[1:] if len(lines) > 1 else []:
            if not line.startswith("#"):
                description = line
                break

        name_no_ext = f.replace(".md", "")
        parts = name_no_ext.split("-")
        if len(parts) >= 3 and all(p.isdigit() for p in parts[:3]):
            date = f"{parts[0]}-{parts[1]}-{parts[2]}"

        html = markdown.markdown(text)

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