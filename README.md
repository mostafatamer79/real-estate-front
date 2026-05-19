# Real Estate Frontend

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run start
```

## Required Environment

Copy `.env.example` to `.env` and set:

- `NEXT_PUBLIC_API_URL`

Use the full API base URL, including `/api`, for example:

```env
NEXT_PUBLIC_API_URL=https://api.example.com/api
```

## Production Notes

- The app falls back to static metadata if the backend is unavailable during build.
- Public settings are fetched at runtime from the backend settings endpoint.
