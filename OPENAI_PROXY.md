# OpenAI-compatible proxy (ships with Big RAG)

LM Studio does **not** support plugin `integrations` on `/v1/chat/completions`. This proxy lives **inside the plugin package** so it is distributed with the same repo / plugin checkout. It rewrites chat completions to native `/api/v1/chat` with Big RAG plugin `integrations`, and forwards other `/v1/*` routes to LM Studio unchanged.

| Path | Behavior | Hits Big RAG plugin? |
|------|----------|----------------------|
| `POST /v1/chat/completions` | Rewrite → `/api/v1/chat` + `integrations: mindstudio/big-rag` | Yes |
| Other `/v1/*` | Forward unchanged | No |
| `GET /health` | Proxy health | — |

> Hub install enables the plugin in LM Studio; start this proxy when an OpenAI SDK needs `/v1/chat/completions`. The proxy always calls your installed plugin via the native API.

## Run (from this plugin directory)

```bash
cd big-rag-plugin
npm install
export LM_API_TOKEN=...   # if LM Studio API auth is on
npm run proxy             # builds then starts on port 1235
```

Default listen port: **1235**. Point OpenAI clients at `http://127.0.0.1:1235/v1`.

```python
from openai import OpenAI
client = OpenAI(base_url="http://127.0.0.1:1235/v1", api_key="lm-studio")
print(client.chat.completions.create(
    model="your-model-id",
    messages=[{"role": "user", "content": "What does the documentation say about rifling?"}],
    temperature=0,
).choices[0].message.content)
```

## Environment

| Variable | Default | Meaning |
|----------|---------|---------|
| `PORT` | `1235` | Proxy listen port |
| `LM_STUDIO_BASE_URL` | `http://127.0.0.1:1234` | Upstream LM Studio |
| `LM_API_TOKEN` | — | Bearer if request has no `Authorization` |
| `BIG_RAG_PLUGIN_ID` | `mindstudio/big-rag` | Plugin id for `integrations` |
| `BIG_RAG_ALLOWED_TOOLS` | — | Optional comma-separated allowlist |
| `BIG_RAG_DISABLE_INTEGRATIONS=1` | off | Passthrough chat (debug) |
| `BIG_RAG_STORE_CHAT=1` | off | Native `store: true` |

## Source

TypeScript under [`src/openaiProxy/`](src/openaiProxy/). Covered by `npm test` in this package.
