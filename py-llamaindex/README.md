# Assistant0: An AI Personal Assistant Secured with Auth0 - Llamaindex Python/FastAPI Version

Assistant0 an AI personal assistant that consolidates your digital life by dynamically accessing multiple tools to help you stay organized and efficient.

## About the template

This template scaffolds an Auth0 + LlamaIndex.js + React JS starter app. It mainly uses the following libraries:

- [LlamaIndex's Python framework](https://docs.llamaindex.ai/en/stable/#introduction)
- The [Auth0 AI SDK](https://github.com/auth0-lab/auth0-ai-python) and [Auth0 FastAPI SDK](https://github.com/auth0/auth0-fastapi) to secure the application and call third-party APIs.
- [Auth0 FGA](https://auth0.com/fine-grained-authorization) to define fine-grained access control policies for your tools and RAG pipelines.

## 🚀 Getting Started

First, clone this repo and download it locally.

```bash
git clone https://github.com/auth0-samples/auth0-assistant0.git
cd auth0-assistant0/py-llamaindex
```

The project is divided into two parts:

- `backend/` contains the backend code for the Web app and API written in Python using FastAPI.
- `frontend/` contains the frontend code for the Web app written in React as a Vite SPA.

### Setup the backend

```bash
cd backend
```

Next, you'll need to set up environment variables in your repo's `.env` file. Copy the `.env.example` file to `.env`.

To start with the basic examples, you'll just need to add your OpenAI API key and Auth0 credentials.

- To start with the examples, you'll just need to add your OpenAI API key and Auth0 credentials for the Web app.
  - You can setup a new Auth0 tenant with an Auth0 Web App and Token Vault following the Prerequisites instructions [here](https://auth0.com/ai/docs/call-others-apis-on-users-behalf).
  - An Auth0 FGA account, you can create one [here](https://dashboard.fga.dev). Add the FGA store ID, client ID, client secret, and API URL to the `.env` file.

Next, install the required packages using your preferred package manager, e.g. uv:

```bash
uv sync
```

Now you're ready to start the database:

```bash
# start the postgres database
docker compose up -d
```

Initialize FGA store:

```bash
source .venv/bin/activate
python -m app.core.fga_init
```

Now you're ready to run the development server:

```bash
source .venv/bin/activate
uv run uvicorn app.main:app --reload
# fastapi dev app/main.py
```

### Start the frontend server

Rename `.env.example` file to `.env` in the `frontend` directory.

Finally, you can start the frontend server in another terminal:

```bash
cd frontend
cp .env.example .env # Copy the `.env.example` file to `.env`.
npm install
npm run dev
```

## Auth configuration

There are two supported setups:

### 1) SPA (frontend) + FastAPI (backend) + embedded LlamaIndex agent
- In Auth0 Dashboard:
  - Create a **SPA Application** for the frontend.
  - Create an **API (Resource Server)** for the FastAPI backend.
  - (If using Federated Connections like Google Calendar) enable **Token Vault** and grant your backend the right audience/scopes.
- The frontend obtains an **access token** for the API and calls the FastAPI endpoints.
- FastAPI uses **Auth0 FastAPI SDK** to validate the token and manage the session. Tools read access tokens from the session and use Token Vault for federated access.

### 2) Regular Web App (FastAPI handles browser auth) + embedded LlamaIndex agent
- In Auth0 Dashboard:
  - Create a **Regular Web App** for FastAPI.
  - (Optional) Create an API if you also expose protected endpoints to SPAs.
- FastAPI handles cookie-based session and federated connections via Token Vault.
- Tools do **not** receive tokens as arguments; they read them from the session or use the federated-connection wrapper.

This will start a React vite server on port 5173.

#TODO IMAGE

Agent configuration lives in `backend/app/agents/assistant0.ts`. From here, you can change the prompt and model, or add other tools and logic.

## License

This project is open-sourced under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

This project is built by [Adam W.](https://github.com/AdamWozniewski).

