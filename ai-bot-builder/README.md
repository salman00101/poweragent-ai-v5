# AI Bot Builder (local)

A lightweight Streamlit app for generating and reviewing Python automation code using a locally running Ollama model. Intended for automation of systems you own or are authorized to test.

## Requirements
- Windows/macOS/Linux with Python 3.10+
- Ollama installed and running: https://ollama.com
- A local model such as `qwen2.5:1.5b` (recommended for 16 GB RAM / 2 GB VRAM)

## Setup (Windows PowerShell)
```powershell
ollama pull qwen2.5:1.5b
cd ai-bot-builder
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
streamlit run app.py
```
Ollama typically listens on http://localhost:11434. If the Ollama service is not running, start it before generating code.

## Features
- Custom user instructions saved in the browser session (not on GitHub)
- Generate code with a local model
- Inspect and edit generated code before saving
- Download generated Python source
- No arbitrary execution of generated code by this app

## Scope
The builder supports authorized testing, productivity, and automation. It does not generate workflows to bypass CAPTCHA, phone/OTP verification, account-creation limits, or anti-abuse measures. Model output is untrusted: review it before running it.

## Notes
Model output can be inaccurate. The app is a starter project, not a hardened multi-user service. Keep it bound to localhost, and do not paste passwords or secrets into prompts.

## Run online without installing anything on your PC

The cloud entrypoint is `ai-bot-builder/cloud_app.py`. It uses a user-provided Hugging Face access token instead of local Ollama. Hugging Face offers limited free inference credits; model availability and billing can change.

1. Visit https://share.streamlit.io and sign in with GitHub.
2. Select **Create app** → **I have an app**.
3. Repository: `salman00101/poweragent-ai-v5`.
4. Branch: your repository's default branch (usually `main`).
5. Main file path: `ai-bot-builder/cloud_app.py`.
6. Click **Deploy**. Streamlit should install the sibling `requirements.txt` automatically.
7. Open the generated `streamlit.app` link and enter a Hugging Face token in the password field. Choose a model available through Inference Providers.

**Security:** Never commit API tokens to GitHub. The app does not save the token to the repository. If you deploy publicly, other visitors can open the UI but must supply their own token. Cloud prompts go to the inference provider. Do not enter sensitive information. The app never executes generated code.

The original local entrypoint remains `ai-bot-builder/app.py`.

## Cloud edition update (Groq)

The deployed entrypoint `ai-bot-builder/cloud_app.py` now uses Groq instead of Hugging Face, so the previous 402 Hugging Face credits error no longer applies. It requires a Groq API key, and free-tier rate limits apply. Create your own key at https://console.groq.com/keys and enter it in the sidebar of the Streamlit app. Never share keys or commit them to the repository. The key is not saved by this application.

The **My coding rules** editor lets you write your own style, library, explanation, and testing preferences. Download them as a text file for reuse. They do not override restrictions on account-abuse or verification-bypass automation.

The app has not been end-to-end tested with a real API key. If Groq returns a model-not-found or access error, choose the other model from the sidebar. Cloud prompts are processed by Groq, and generated code is not executed.
