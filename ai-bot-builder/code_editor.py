"""Cloud code editor: revise user-supplied code using natural-language instructions."""
import difflib
import re
import requests
import streamlit as st

API_URL = "https://api.groq.com/openai/v1/chat/completions"
MODELS = ["openai/gpt-oss-20b", "openai/gpt-oss-120b"]
BASE_RULES = """You are a code-editing assistant. Revise code supplied by the user according to their instructions.
Return ONLY the full updated source code, without Markdown fences. Preserve unrelated behavior.
Do not insert secrets. Do not assist with bypassing third-party CAPTCHA, OTP, phone verification,
anti-abuse systems, or mass account creation/spam/credential abuse. For such requests, explain briefly
that the change cannot be made. Do not claim to have run or tested the code."""
DISALLOWED = [
    r"(?i)(?:gmail|google accounts?).{0,100}(?:bulk|mass|multiple|create|signup|register)",
    r"(?i)(?:bulk|mass).{0,100}(?:gmail|google accounts?)",
    r"(?i)(?:bypass|evade|skip|defeat|disable|remove).{0,100}(?:captcha|otp|phone.verification|anti.abuse|security.verification)",
    r"(?i)(?:captcha|otp|phone.verification|anti.abuse).{0,100}(?:bypass|evade|skip|defeat|disable|remove)",
]

st.set_page_config(page_title="AI Code Editor", page_icon="🛠️", layout="wide")
st.title("🛠️ AI Code Editor")
st.caption("Paste or upload code, describe your changes, preview a diff, and download the result. Browser only.")

with st.sidebar:
    st.header("Groq Cloud")
    api_key = st.text_input("Groq API key", type="password")
    model = st.selectbox("Model", MODELS)
    st.caption("Get a key at https://console.groq.com/keys. Never share or commit it.")
    st.info("Edits are suggestions; this app never runs or deploys your code.")

file = st.file_uploader("Upload a source file (optional)", type=[
    "py", "js", "ts", "tsx", "jsx", "html", "css", "json", "txt", "md", "sh", "java", "go", "rs"
])
if file is not None:
    uploaded = file.getvalue().decode("utf-8", errors="replace")
    fingerprint = (file.name, len(file.getvalue()))
    if st.session_state.get("uploaded_fingerprint") != fingerprint:
        st.session_state["source_code"] = uploaded
        st.session_state["uploaded_fingerprint"] = fingerprint

if "source_code" not in st.session_state:
    st.session_state.source_code = ""
if "result_code" not in st.session_state:
    st.session_state.result_code = ""

st.subheader("1. Original code")
source = st.text_area("Paste code here", key="source_code", height=310)
st.subheader("2. Describe changes")
request = st.text_area("What should change?", height=115,
    placeholder="Refactor into functions, add logging and unit tests, and keep existing behavior.")
language = st.selectbox("Code language", ["Auto-detect", "Python", "JavaScript", "TypeScript", "HTML/CSS", "Other"])
custom = st.text_area("Additional coding preferences (optional)", height=90,
    placeholder="Use Roman Urdu in explanations, keep function names, prefer standard library.")

if st.button("Modify my code", type="primary"):
    if not source.strip() or not request.strip():
        st.error("Provide both source code and change instructions.")
    elif not api_key.strip():
        st.error("Enter your Groq API key in the sidebar.")
    elif any(re.search(p, request + "\n" + custom) for p in DISALLOWED):
        st.error("This editor cannot implement verification bypass or account-abuse changes.")
    elif len(source) > 40000:
        st.error("Code is too long for this editor (40,000 characters maximum).")
    else:
        try:
            with st.spinner("Revising your code..."):
                resp = requests.post(API_URL,
                    headers={"Authorization": f"Bearer {api_key.strip()}"},
                    json={"model": model, "temperature": 0.2, "max_tokens": 4096,
                          "messages": [
                              {"role": "system", "content": BASE_RULES},
                              {"role": "user", "content": (
                                  f"Language: {language}\nCoding preferences: {custom}\n"
                                  f"Requested changes: {request}\n\nORIGINAL CODE:\n{source}"
                              )},
                          ]},
                    timeout=120)
            if resp.status_code == 401:
                st.error("Invalid Groq API key.")
            elif resp.status_code == 429:
                st.error("Groq rate limit reached. Retry later.")
            elif not resp.ok:
                st.error(f"Groq API error {resp.status_code}: {resp.text[:300]}")
            else:
                result = resp.json()["choices"][0]["message"]["content"].strip()
                if result.startswith("```"):
                    result = re.sub(r"^\`\`\`[^\n]*\n|\n\`\`\`$", "", result)
                st.session_state.result_code = result
        except (requests.RequestException, KeyError, IndexError, ValueError) as exc:
            st.error(f"Request failed: {exc}")

if st.session_state.result_code:
    st.subheader("3. Review edited code")
    updated = st.text_area("Updated code (editable)", key="result_code", height=340)
    diff = "".join(difflib.unified_diff(
        source.splitlines(keepends=True), updated.splitlines(keepends=True),
        fromfile="original", tofile="updated"))
    with st.expander("Show changes (unified diff)"):
        st.code(diff or "No text changes", language="diff")
    extension = {"Python": "py", "JavaScript": "js", "TypeScript": "ts", "HTML/CSS": "html"}.get(language, "txt")
    filename = file.name if file is not None else f"modified_code.{extension}"
    st.download_button("Download modified code", updated, file_name=filename, mime="text/plain")
    st.download_button("Download diff", diff, file_name="changes.patch", mime="text/plain")
st.caption("Do not paste credentials or private data. Code is sent to Groq for processing; verify edits before use.")
