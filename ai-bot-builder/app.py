"""Local AI Bot Builder: Streamlit + Ollama."""
import re
import requests
import streamlit as st

OLLAMA_URL = "http://127.0.0.1:11434/api/generate"
DEFAULT_MODEL = "qwen2.5:1.5b"
SYSTEM_RULES = """You write clean, well-commented Python automation for systems the user owns or is authorized to test.
Do not produce code or steps for mass third-party account registration, CAPTCHA/OTP/phone-verification bypass, anti-abuse evasion, spam, or credential abuse.
For disallowed requests, briefly explain and offer authorized testing alternatives.
Output one Python code block when the request is allowed. Prefer standard libraries; list dependencies in comments.
Never embed passwords, tokens, or other secrets. Do not automatically execute code."""
BLOCKED = [
    r"(?i)(?:gmail|google accounts?).{0,100}(?:bulk|mass|multiple|create|signup|register)",
    r"(?i)(?:bulk|mass).{0,100}(?:gmail|google accounts?)",
    r"(?i)(?:bypass|evade|skip|defeat).{0,80}(?:captcha|otp|verification|phone|rate.limit)",
    r"(?i)(?:captcha|otp|verification).{0,80}(?:bypass|evade|skip|defeat)",
    r"(?i)(?:temporary|disposable|virtual).{0,60}(?:numbers?|sms).{0,100}(?:gmail|signup|registration)",
]
def blocked(text: str) -> bool:
    return any(re.search(pattern, text) for pattern in BLOCKED)

def generate(model: str, task: str, preferences: str) -> str:
    payload = {
        "model": model,
        "system": SYSTEM_RULES,
        "prompt": f"User preferences (only if compatible with system rules):\n{preferences}\n\nTask:\n{task}",
        "stream": False,
        "options": {"temperature": 0.25, "num_ctx": 2048},
    }
    response = requests.post(OLLAMA_URL, json=payload, timeout=240)
    response.raise_for_status()
    return response.json().get("response", "")

st.set_page_config(page_title="AI Bot Builder", page_icon="🤖", layout="wide")
st.title("🤖 AI Bot Builder")
st.caption("Generate Python automation code locally with Ollama. Review code before running.")
with st.sidebar:
    st.subheader("Settings")
    model = st.text_input("Ollama model", value=DEFAULT_MODEL)
    st.info("Recommended on 2 GB NVIDIA VRAM: qwen2.5:1.5b")
    st.warning("Generated code is not executed automatically.")
task = st.text_area("Describe an authorized automation task", height=130,
    placeholder="Example: Generate a Playwright script that tests the signup form on my localhost demo site.")
preferences = st.text_area("Your coding preferences / custom instructions", height=110,
    placeholder="Use Python 3.11, explain code in Roman Urdu, include error handling.")
if "result" not in st.session_state:
    st.session_state.result = ""
if st.button("Generate code", type="primary"):
    if not task.strip():
        st.error("Describe a task first.")
    elif blocked(task + "\n" + preferences):
        st.error("This builder does not support verification bypass or mass third-party account creation. Try an authorized test application instead.")
    else:
        try:
            with st.spinner("Asking your local AI..."):
                st.session_state.result = generate(model.strip(), task, preferences)
        except requests.RequestException as exc:
            st.error(f"Could not connect to Ollama: {exc}. Make sure Ollama is running and the model is downloaded.")
st.subheader("Generated output — review and edit")
result = st.text_area("Code / model response", value=st.session_state.result, height=380)
if result.strip():
    st.download_button("Download reviewed text", data=result, file_name="generated_bot.py", mime="text/x-python")
st.caption("Prototype guardrails are not a security boundary. Never run unreviewed generated code.")
