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
