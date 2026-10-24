"""Model-free, browser-based research and template bot builder."""
import io
import json
import re
import zipfile
from urllib.parse import quote
import requests
import streamlit as st

st.set_page_config(page_title="Research Bot Builder", page_icon="🧰", layout="wide")
st.title("🧰 Research Bot Builder — No AI model")
st.caption("Search public GitHub examples, choose a supported template, and download a working starter project. No AI key or PC installation.")

TEMPLATES = {
    "Folder organizer": {
        "terms": "python organize files pathlib",
        "description": "Sort local files into folders by extension.",
        "files": {
            "bot.py": '''from pathlib import Path
import shutil
import argparse

def organize(folder: Path):
    if not folder.is_dir():
        raise ValueError("Folder does not exist")
    for item in folder.iterdir():
        if not item.is_file():
            continue
        category = item.suffix.lower().lstrip(".") or "no_extension"
        destination = folder / category
        destination.mkdir(exist_ok=True)
        target = destination / item.name
        if target.exists():
            print(f"Skipping existing file: {target}")
            continue
        shutil.move(str(item), str(target))
        print(f"Moved {item.name} to {category}/")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("folder", type=Path)
    args = parser.parse_args()
    organize(args.folder)
''',
            "requirements.txt": "",
        },
    },
    "Website status checker": {
        "terms": "python requests website status monitoring",
        "description": "Check availability of public URLs at a user-chosen interval.",
        "files": {
            "bot.py": '''import argparse
import time
import requests

def check(url):
    try:
        response = requests.get(url, timeout=12, allow_redirects=True,
                                headers={"User-Agent": "PersonalStatusChecker/1.0"})
        print(f"{url}: HTTP {response.status_code}")
    except requests.RequestException as exc:
        print(f"{url}: ERROR {exc}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("url", help="Public URL you own or are authorized to check")
    parser.add_argument("--interval", type=int, default=60)
    args = parser.parse_args()
    if args.interval < 30:
        parser.error("Minimum interval is 30 seconds")
    while True:
        check(args.url)
        time.sleep(args.interval)
''',
            "requirements.txt": "requests>=2.32,<3\n",
        },
    },
    "CSV report generator": {
        "terms": "python csv report aggregation examples",
        "description": "Summarize numeric CSV columns using the Python standard library.",
        "files": {
            "bot.py": '''import argparse
import csv
from pathlib import Path

def summarize(source: Path):
    with source.open(newline="", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        totals, counts = {}, {}
        for row in reader:
            for key, raw in row.items():
                try:
                    value = float(raw)
                except (TypeError, ValueError):
                    continue
                totals[key] = totals.get(key, 0) + value
                counts[key] = counts.get(key, 0) + 1
    for key in totals:
        print(f"{key}: count={counts[key]}, sum={totals[key]:.2f}, average={totals[key]/counts[key]:.2f}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("csv_file", type=Path)
    summarize(parser.parse_args().csv_file)
''',
            "requirements.txt": "",
        },
    },
}

def find_template(prompt):
    tokens = set(re.findall(r"[a-z]{4,}", prompt.lower()))
    keywords = {
        "Folder organizer": {"file", "files", "folder", "organize", "sort", "extension"},
        "Website status checker": {"website", "status", "uptime", "monitor", "http", "check"},
        "CSV report generator": {"csv", "report", "spreadsheet", "average", "sum", "data"},
    }
    scores = {name: len(tokens & words) for name, words in keywords.items()}
    return max(scores, key=scores.get) if max(scores.values()) else None

def github_research(query):
    response = requests.get("https://api.github.com/search/repositories",
        params={"q": query + " in:name,description language:python", "sort": "stars", "per_page": 5},
        headers={"Accept": "application/vnd.github+json", "User-Agent": "ResearchBotBuilder/1.0"},
        timeout=15)
    response.raise_for_status()
    return [{
        "name": item["full_name"],
        "url": item["html_url"],
        "description": (item.get("description") or "")[:180],
        "stars": item["stargazers_count"],
    } for item in response.json().get("items", [])]

prompt = st.text_area("Describe your bot", placeholder="Make a bot to organize files by extension", height=110)
choice = st.selectbox("Starter template", ["Auto-detect"] + list(TEMPLATES))
research = st.checkbox("Research public GitHub repositories for examples", value=True)
st.caption("Research results are references only. External repository code is not downloaded, copied, or executed.")
if st.button("Research and build", type="primary"):
    detected = find_template(prompt)
    selected = detected if choice == "Auto-detect" else choice
    if not prompt.strip():
        st.error("Enter a description first.")
    elif selected is None:
        st.warning("No matching template found. Choose a starter template manually. This tool cannot invent arbitrary new code without an AI model.")
    else:
        info = TEMPLATES[selected]
        st.session_state["selected"] = selected
        st.session_state["research_results"] = []
        if research:
            try:
                with st.spinner("Searching public examples..."):
                    st.session_state["research_results"] = github_research(info["terms"])
            except (requests.RequestException, ValueError) as exc:
                st.warning(f"Research unavailable right now: {exc}")
        st.success(f"Starter project ready: {selected}")

if "selected" in st.session_state:
    selected = st.session_state["selected"]
    info = TEMPLATES[selected]
    st.subheader(selected)
    st.write(info["description"])
    files = dict(info["files"])
    files["README.md"] = (
        f"# {selected}\n\n{info['description']}\n\n"
        "## Getting started\n\n"
        "Install requirements (if any) with `pip install -r requirements.txt`.\n"
        "Run `python bot.py --help` for supported arguments.\n\n"
        "Review and test this starter code before using it.\n"
    )
    edited = st.text_area("Review/edit bot.py", value=files["bot.py"], height=360)
    files["bot.py"] = edited
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as archive:
        for name, data in files.items():
            archive.writestr(name, data)
    st.download_button("Download bot project (.zip)", buffer.getvalue(),
        file_name="research_bot_project.zip", mime="application/zip")
    results = st.session_state.get("research_results", [])
    if results:
        st.subheader("Public GitHub research references")
        for item in results:
            st.markdown(f"**[{item['name']}]({item['url']})** · ⭐ {item['stars']}")
            st.caption(item["description"])
    st.info("Template projects are not automatically executed or deployed. Research links may have different licenses.")
