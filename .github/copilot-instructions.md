# Copilot instructions (sahkoapuri)

## Quick start (local)

- Dev server: `npm run dev` (nodemon + ts-node) runs `src/index.ts` with `tsconfig-paths/register`.
- Build: `npm run build` runs `tsc && tsc-alias` to compile to `dist/`.
- Start: `npm start` runs `node dist/index.js`.
- Tests: `npm test` (Jest + ts-jest). `dist/` is ignored by Jest.

## Runtime architecture

- Entrypoint: `src/index.ts` connects Mongo via `src/utils/db.ts` (Mongoose) and then starts the Express server.
- Express app: `src/app.ts` loads env via `dotenv.config()`, then sets up `helmet` CSP, `morgan`, `cors`, JSON parsing, serves `public/`, mounts `/api/v1`, then `notFound` + `errorHandler` from `src/middlewares/error.ts`.
- API structure: `src/api/v1/{routes,controllers,models}` (see `src/api/v1/routes/exampleRoute.ts`, `src/api/v1/controllers/exampleController.ts`, `src/api/v1/models/exampleModel.ts`).

## Environment variables

- `MONGO_DB` is required (Mongo connection string). `src/utils/db.ts` throws if missing.
- `PORT` optional (defaults to `3000`).
- `NODE_ENV` affects:
  - CSP: allows `'unsafe-eval'` only when `NODE_ENV=development` (used for Apidoc)
  - error responses: `src/middlewares/error.ts` hides stack in production

## Code conventions (project-specific)

- Import alias: prefer `@/…` for `src/…` (configured in `tsconfig.json`, Jest `moduleNameMapper`, runtime via `tsconfig-paths/register`, and build via `tsc-alias`).
- Request validation: validate `req.body`/`req.query`/`req.params` with Zod at the route boundary (see `src/middlewares/validate.ts`). Prefer Zod schemas as the API contract and infer TS types from them.
- Error handling: throw/forward `CustomError` (see `src/classes/CustomError.ts`) and use `next(err)`; API errors are shaped by `errorHandler` as `{ message, stack? }`.
- Controller typing: type Express `Request`/`Response` with generics (e.g. `Request<{}, {}, Body>` + `Response<MessageResponse & {...}>`); types may come from shared DTOs (e.g. `src/types/LocalTypes.ts`), Mongoose model exports, or feature-local files (see `examplePost` in `src/api/v1/controllers/exampleController.ts`).
- Adding endpoints: add a controller + route file, then mount the route from `src/api/v1/index.ts` via `router.use('/<name>', <router>)` (e.g. `/api/v1/example` comes from `router.use('/example', exampleRouter)`).

## Agent behavior (team preference)

- Work mode: strict reviewer → pair programmer → teaching-oriented.
- Be concise; use inline comments only and keep them minimal.
- Always ask clarifying questions when requirements are ambiguous.
- Suggest refactors only with approval; make a plan first for large changes.
- Analyze but don’t modify third-party/legacy code by default; preserve existing comments.
- Ignore accessibility/inclusivity unless explicitly requested.
