# Setup the backend

```bash
cd backend
```

You'll need to set up environment variables in your repo's `.env` file. Copy the `.env.example` file to `.env`.

To start with the basic examples, you'll just need to add your OpenAI API key and Auth0 credentials.

- To start with the examples, you'll just need to add your OpenAI API key and Auth0 credentials for the Web app.
  - You can set up a new Auth0 tenant with an Auth0 Web App and Token Vault following the Prerequisites instructions [here](https://auth0.com/ai/docs/get-started/call-others-apis-on-users-behalf).
  - An Auth0 FGA account, you can create one [here](https://dashboard.fga.dev). Add the FGA store ID, client ID, client secret, and API URL to the `.env` file.

Next, install the required packages using your preferred package manager, e.g. uv:

```bash
uv sync
```

Now you're ready to start and migrate the database:

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
fastapi dev app/main.py
```

Next, you'll need to start an in-memory LangGraph server on port 54367, to do so open a new terminal and run:

```bash
source .venv/bin/activate
uv pip install -U langgraph-api
langgraph dev --port 54367 --allow-blocking
```
