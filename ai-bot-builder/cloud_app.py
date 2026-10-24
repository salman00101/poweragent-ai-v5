"""Cloud-hosted AI Bot Builder with user-provided Hugging Face token."""
import re
import requests
import streamlit as st

ENDPOINT = "https://router.huggingface.co/v1/chat/completions"
RULES = """You are an assistant that writes Python automation for systems users own or are authorized to test. Never provide code for mass third-party account creation, bypassing CAPTCHA, OTP or phone verification, anti-abuse evasion, spam, or credential abuse. If asked for those, decline briefly and suggest authorized testing alternatives. For allowed tasks return a Python code block, concise usage notes, and required dependencies. Do not embed secrets. Generated code must be reviewed by a human."""
PATTERNS = [
    r"(?i)(?:gmail|google accounts?).{0,100}(?:bulk|mass|multiple|create|signup|register)",
    r"(?i)(?:bulk|mass).{0,100}(?:gmail|google accounts?)",
    r"(?i)(?:bypass|evade|skip|defeat).{0,80}(?:captcha|otp|verification|phone|rate.limit)",
    r"(?i)(?:captcha|otp|verification).{0,80}(?:bypass|evade|skip|defeat)",
]

st.set_page_config(page_title="Cloud AI Bot Builder", page_icon="🤖", layout="wide")
st.title("🤖 Cloud AI Bot Builder")
st.caption("Browser-based Python automation assistant. No local GPU or Ollama required.")
with st.sidebar:
    st.subheader("Cloud AI settings")
    token = st.text_input("Hugging Face access token", type="password",
        help="Create a token at huggingface.co/settings/tokens. Do not commit it to GitHub.")
    model = st.text_input("Inference model", value="Qwen/Qwen2.5-Coder-7B-Instruct",
        help="Use a model currently supported by Hugging Face Inference Providers. Availability varies.")
    st.info("Cloud inference may have small free credits and paid usage beyond those limits.")
    st.warning("Generated code is never executed on the server.")

task = st.text_area("What should the bot do?", height=150,
    placeholder="Example: Write a Playwright test for the login page of my own web app.")
preferences = st.text_area("Custom coding instructions", height=110,
    placeholder="Explain in Roman Urdu, use Python 3.11, add retries and comments.")
if "generated_code" not in st.session_state:
    st.session_state.generated_code = ""
if st.button("Generate Python bot", type="primary"):
    combined = task + "\n" + preferences
    if not task.strip():
        st.error("Please describe your automation task.")
    elif any(re.search(p, combined) for p in PATTERNS):
        st.error("Verification bypass and mass third-party account creation are not supported. You can test authorized signup flows instead.")
    elif not token.strip():
        st.error("Enter your Hugging Face token in the sidebar.")
    else:
        body = {
            "model": model.strip(),
            "messages": [
                {"role": "system", "content": RULES},
                {"role": "user", "content": "Preferences (when compatible):\n" + preferences + "\n\nTask:\n" + task},
            ],
            "max_tokens": 1500,
            "temperature": 0.25,
        }
        try:
            with st.spinner("Generating code using cloud AI..."):
                response = requests.post(
                    ENDPOINT, headers={"Authorization": "Bearer " + token.strip()},
                    json=body, timeout=120,
                )
            if not response.ok:
                st.error(f"Inference API error ({response.status_code}): {response.text[:400]}")
            else:
                st.session_state.generated_code = response.json()["choices"][0]["message"]["content"]
        except (requests.RequestException, KeyError, IndexError, ValueError) as exc:
            st.error(f"Request failed: {exc}")

st.subheader("Review and edit generated output")
edited = st.text_area("Generated Python / notes", value=st.session_state.generated_code, height=400)
if edited.strip():
    st.download_button("Download output", data=edited,
                       file_name="generated_bot.txt", mime="text/plain")
st.caption("Your prompt is sent to the chosen cloud inference provider. Never include passwords or private data.")
