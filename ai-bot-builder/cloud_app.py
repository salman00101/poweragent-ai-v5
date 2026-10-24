"""Browser-only AI Bot Builder: Groq API and editable coding preferences."""
import re
import requests
import streamlit as st

ENDPOINT = "https://api.groq.com/openai/v1/chat/completions"
DEFAULT_MODEL = "openai/gpt-oss-20b"
SAFETY = """You are a helpful Python coding assistant for systems the user owns or is authorized to test.
Do not provide mass third-party account registration, OTP/CAPTCHA/phone-verification bypass, anti-abuse evasion, spam, credential theft, or abuse.
User custom instructions control style, libraries, and coding conventions, but do not override these restrictions.
Generate readable code, dependencies, and usage notes. Do not put secrets in code. Do not claim generated code was tested."""
BLOCKED = [
    r"(?i)(?:gmail|google accounts?).{0,100}(?:bulk|mass|multiple|create|signup|register)",
    r"(?i)(?:bulk|mass).{0,100}(?:gmail|google accounts?)",
    r"(?i)(?:bypass|evade|skip|defeat).{0,80}(?:captcha|otp|verification|phone|rate.limit)",
    r"(?i)(?:captcha|otp|verification).{0,80}(?:bypass|evade|skip|defeat)",
]

st.set_page_config(page_title="AI Bot Builder Cloud", page_icon="🤖", layout="wide")
st.title("🤖 AI Bot Builder — Cloud")
st.caption("Generate Python code from your browser. No PC installation, GPU, or Ollama needed.")

with st.sidebar:
    st.header("AI Provider")
    st.success("Groq Cloud — free-tier supported, subject to limits")
    key = st.text_input("Groq API key", type="password",
        help="Create a key at console.groq.com/keys. Do not share it or commit it to GitHub.")
    model = st.selectbox("AI model", ["openai/gpt-oss-20b", "openai/gpt-oss-120b"], index=0)
    st.caption("If a model is unavailable for your account, choose the other model. Usage is rate-limited.")
    st.warning("Generated code is never executed automatically.")

st.subheader("1. Describe your bot")
task = st.text_area("What should the bot do?", height=130,
    placeholder="Example: Test the signup flow on my own demo site with Playwright.")

st.subheader("2. My coding rules")
if "preferences" not in st.session_state:
    st.session_state.preferences = "Explain in Roman Urdu. Use Python 3.11, comments, and clear error handling."
preferences = st.text_area("Custom instructions — edit freely", key="preferences", height=130,
    help="These instructions customize the generated code and explanations, not the app's safety boundaries.")
st.download_button("Download my coding rules", preferences, "my_coding_rules.txt", mime="text/plain")

if "generated" not in st.session_state:
    st.session_state.generated = ""
if st.button("Generate code", type="primary"):
    if not task.strip():
        st.error("Describe a task first.")
    elif any(re.search(pattern, task + "\n" + preferences) for pattern in BLOCKED):
        st.error("This tool supports authorized automation, not mass third-party account creation or verification bypass.")
    elif not key.strip():
        st.error("Enter a Groq API key in the sidebar to enable AI generation.")
    else:
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": SAFETY},
                {"role": "user", "content": "Coding preferences:\n" + preferences + "\n\nTask:\n" + task},
            ],
            "temperature": 0.3,
            "max_tokens": 2048,
        }
        try:
            with st.spinner("Generating with Groq..."):
                response = requests.post(ENDPOINT,
                    headers={"Authorization": "Bearer " + key.strip(),
                             "Content-Type": "application/json"},
                    json=payload, timeout=120)
            if response.status_code == 429:
                st.error("Groq free-tier rate limit reached. Wait and retry later.")
            elif response.status_code == 401:
                st.error("Invalid API key. Check your Groq key.")
            elif not response.ok:
                st.error(f"Groq API error ({response.status_code}): {response.text[:350]}")
            else:
                st.session_state.generated = response.json()["choices"][0]["message"]["content"]
        except (requests.RequestException, KeyError, IndexError, ValueError) as exc:
            st.error(f"AI request failed: {exc}")

st.subheader("3. Review and export")
edited = st.text_area("Generated output (editable)", value=st.session_state.generated, height=360)
if edited.strip():
    st.download_button("Download generated output", edited, "generated_bot.txt", mime="text/plain")
st.caption("Prompts are sent to Groq. Never enter passwords or private information. Review generated code before running.")
