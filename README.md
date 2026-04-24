# PhishGuard

PhishGuard contains:
- Frontend: React + Vite (root project)
- Backend: Spring Boot API (`backend/`)

## Local development

### Frontend
1. Install dependencies:
   - `npm i`
2. Create env file:
   - copy `.env.example` to `.env`
3. Start dev server:
   - `npm run dev`

### Backend
1. Go to backend folder:
   - `cd backend`
2. Copy env template and set DB credentials:
   - copy `.env.example` values into your shell env, or set equivalent variables in IDE run config
3. Run Spring Boot:
   - `mvn spring-boot:run`

## Deployment readiness

This repo is now prepared to deploy with environment-driven config.

### Required frontend env
- `VITE_API_BASE_URL` (example: `https://api.yourdomain.com`)

### Required backend env
- `PORT` (usually provided by platform)
- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `APP_CORS_ALLOWED_ORIGINS` (comma separated, example: `https://yourdomain.com`)

### Backend container
Backend includes a Dockerfile at `backend/Dockerfile`.

Build and run locally:
- `cd backend`
- `docker build -t phishguard-api .`
- `docker run --env-file .env -p 8081:8081 phishguard-api`

## Production checklist

- Use managed MySQL (AWS RDS / Azure Database for MySQL)
- Set frontend URL and backend API URL to public HTTPS domains
- Configure CORS with your frontend domain only
- Keep secrets in environment variables (never commit credentials)
  