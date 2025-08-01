## Assistant0: An AI Personal Assistant Secured with Auth0 - LangGraph Python/FastAPI Version

Assistant0 an AI personal assistant that consolidates your digital life by dynamically accessing multiple tools to help you stay organized and efficient.

## About the template

This template scaffolds an Auth0 + LangChain.js + Next.js starter app. It mainly uses the following libraries:

- [LangChain's Python framework](https://python.langchain.com/docs/introduction/) and [LangGraph.js](https://langchain-ai.github.io/langgraph/) for building agentic workflows.
- The [Auth0 AI SDK](https://github.com/auth0-lab/auth0-ai-python) and [Auth0 FastAPI SDK](https://github.com/auth0/auth0-fastapi) to secure the application and call third-party APIs.
- [Auth0 FGA](https://auth0.com/fine-grained-authorization) to define fine-grained access control policies for your tools and RAG pipelines.

## 🚀 Getting Started

First, clone this repo and download it locally.

```bash
git clone https://github.com/auth0-samples/auth0-assistant0.git
cd auth0-assistant0/python-langchain
```

The project is divided into two parts:

- `backend/` contains the backend code for the Web app and API written in Python using FastAPI.
- `frontend/` contains the frontend code for the Web app written in React as a Vite SPA.

### Setup the backend

```bash
cd backend
```

Next, you'll need to set up environment variables in your repo's `.env` file. Copy the `.env.example` file to `.env.local`.

To start with the basic examples, you'll just need to add your OpenAI API key and Auth0 credentials.

- To start with the examples, you'll just need to add your OpenAI API key and Auth0 credentials for the Web app.
  - You can setup a new Auth0 tenant with an Auth0 Web App and Token Vault following the Prerequisites instructions [here](https://auth0.com/ai/docs/call-others-apis-on-users-behalf).
  - An Auth0 FGA account, you can create one [here](https://dashboard.fga.dev). Add the FGA store ID, client ID, client secret, and API URL to the `.env.local` file.

Next, install the required packages using your preferred package manager, e.g. uv:

```bash
uv sync
```

Now you're ready to run the development server:

```bash
source .venv/bin/activate
fastapi dev app/main.py
```

Next, you'll need to start an in-memory LangGraph server on port 54367, to do so run:

```bash
langgraph dev --port 54367 --allow-blocking
```

Finally, you can start the frontend server:

```bash
cd frontend
npm install
npm run dev
```

This will start a React vite server on port 54367.

![A streaming conversation between the user and the AI](./public/images/home-page.png)

Agent configuration lives in `backend/app/agents/assistant0.ts`. From here, you can change the prompt and model, or add other tools and logic.

## License

This project is open-sourced under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

This project is built by [Juan Cruz Martinez](https://github.com/jcmartinezdev).
