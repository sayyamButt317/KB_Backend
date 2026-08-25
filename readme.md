# KB Backend

Node.js API for uploading documents, generating embeddings, and chatting over that knowledge base. File processing runs in a BullMQ worker backed by Redis. Vectors are stored in Qdrant.

The HTTP server listens on **port 8000**.

## Prerequisites

- Node.js 18+
- Docker (for Redis/Valkey)
- OpenAI API key
- Qdrant (local Docker or Qdrant Cloud)

## Setup

```powershell
npm install
```

Copy the variables below into a `.env` file in the project root:

```env
OPENAI_API_KEY=your_openai_key
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_USERNAME=default
REDIS_PASSWORD=dummy
GEMINI_API_KEY=
```

- For **local Qdrant**, keep `QDRANT_URL=http://localhost:6333` and leave `QDRANT_API_KEY` empty.
- For **Qdrant Cloud**, set the cloud URL and API key.
- Local Valkey has no auth. `src/Config/redis.js` still requires `REDIS_USERNAME` and `REDIS_PASSWORD`, so dummy values are fine.

## Start services

```powershell
docker compose up -d
```

This starts:

- **Valkey/Redis** on port `6379` (required for upload queues)
- **Qdrant** on port `6333` (only needed if you are not using Qdrant Cloud)

## Run

You need two terminals.

**API server**

```powershell
npm run dev
```

You should see: `Server running on port 8000`.

**Worker** (processes file/folder embedding jobs)

```powershell
npm run dev:worker
```

Without the worker, uploads will queue but embeddings will not finish.

## API

Base URL: `http://localhost:8000`

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/upload/file` | Upload one file (`form-data` field: `file`) |
| `POST` | `/upload/folder` | Upload many files (`form-data` field: `files`) |
| `GET` | `/chat?message=your question` | Chat against the embeddings |

Video and TTS routes exist in code but are commented out in `src/Routes/ai.routes.js`.

## Deploy (EC2 + Nginx)

Domain: `api-kb.techtimize.co` → Nginx → Node on port `8000`.

Copy-paste commands are in [`deploy/README.md`](deploy/README.md).

```bash
sudo bash deploy/setup.sh
sudo certbot --nginx -d api-kb.techtimize.co
```

Later updates:

```bash
sudo bash deploy/update.sh
```

### CI/CD

Pushing to `master` runs GitHub Actions: install + syntax check, then SSH deploy to EC2.

Add these repo secrets: `EC2_HOST`, `EC2_USER`, `EC2_SSH_KEY` (optional: `EC2_APP_DIR`, `EC2_PORT`). Details in [`deploy/README.md`](deploy/README.md#5-cicd-github-actions).

## Example requests

Upload a file:

```powershell
curl -X POST http://localhost:8000/upload/file -F "file=@./example.pdf"
```

Ask a question:

```powershell
curl "http://localhost:8000/chat?message=What%20is%20this%20document%20about"
```
