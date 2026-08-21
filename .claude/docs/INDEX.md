# Framework Docs — Local Reference

LLM-friendly documentation for the frameworks used in this monorepo. Consult these before answering framework questions — they're authoritative and version-current.

## Next.js — `apps/web`

**Source:** https://nextjs.org/docs
**Location:** `.claude/docs/nextjs/`
**Version at sync:** 16.3.1
**Last synced:** 2026-08-20

- [llms.txt](nextjs/llms.txt) — **compact index** of every doc page with one-line descriptions and URLs. Start here to find the right topic (47 KB)
- [llms-full.txt](nextjs/llms-full.txt) — **full docs concatenated** — every page's markdown in one file. Use `grep` / `Read` with offset+limit to zoom into a section (3.9 MB)

**How to use:**
1. `grep -in "topic keyword" .claude/docs/nextjs/llms.txt` → find the relevant page URLs
2. `grep -n "^# " .claude/docs/nextjs/llms-full.txt` → list top-level sections in the full doc
3. `grep -n "topic" .claude/docs/nextjs/llms-full.txt` → find line numbers
4. `Read` with `offset` and `limit` to load only the relevant span

**Refresh:**
```bash
curl -sSL -o .claude/docs/nextjs/llms.txt https://nextjs.org/docs/llms.txt
curl -sSL -o .claude/docs/nextjs/llms-full.txt https://nextjs.org/docs/llms-full.txt
```

## NestJS — `apps/api`

**Source:** https://docs.nestjs.com (site) / https://github.com/nestjs/docs.nestjs.com (sources)
**Location:** `.claude/docs/nestjs/`
**Last synced:** 2026-08-20

NestJS does NOT publish an `llms.txt` — this is the raw markdown from their docs site (`content/` directory of the docs repo), 136 files.

### Top-level (single-file topics)
- `introduction.md`, `first-steps.md`
- `controllers.md`, `modules.md`, `middlewares.md`, `pipes.md`, `guards.md`, `interceptors.md`
- `exception-filters.md`, `custom-decorators.md`
- `application-context.md`, `components.md`, `deployment.md`, `migration.md`
- `enterprise.md`, `support.md`

### Subdirectories
- `fundamentals/` — DI, providers, lifecycle, async providers, dynamic modules, testing
- `techniques/` — auth, caching, config, cookies, events, logger, mongo, mvc, queues, serialization, task-scheduling, validation, file-upload, streaming, sse, session, versioning, hot-reload, compression, MikroORM, TypeORM
- `security/` — authentication, authorization, CORS, CSRF, encryption, helmet, rate-limiting
- `microservices/` — patterns, custom transporters, gRPC, Kafka, MQTT, NATS, RabbitMQ, Redis
- `websockets/` — gateways, adapters, exception filters, guards, interceptors, pipes
- `graphql/` — schemas, resolvers, mutations, subscriptions, federation, unions, directives, scalars, plugins
- `openapi/` — decorators, types & parameters, operations, security, mapped types, cli-plugin
- `cli/` — overview, monorepo, libraries, scripts, workspaces, usages
- `recipes/` — passport, mongodb, sql-typeorm, sql-sequelize, cqrs, swc, prisma, sentry, terminus, nest-commander, serve-static, hot-reload, official-nest-console, router-module, async-local-storage, necord, suites, gremlin, obs
- `devtools/` — CI/CD integration, overview
- `faq/` — common questions
- `discover/` — companies using NestJS

**How to use:**
1. `ls .claude/docs/nestjs/` — see top-level files
2. `ls .claude/docs/nestjs/<subdir>/` — browse a category
3. `grep -rln "topic" .claude/docs/nestjs/` — search across all docs
4. `Read` the relevant `.md` directly — most are 5–30 KB, load fully

**Refresh:**
```bash
TMPDIR=$(mktemp -d) && \
  curl -sSL https://github.com/nestjs/docs.nestjs.com/archive/refs/heads/master.tar.gz | tar -xz -C "$TMPDIR" && \
  rm -rf .claude/docs/nestjs/* && \
  cp -r "$TMPDIR"/docs.nestjs.com-master/content/* .claude/docs/nestjs/ && \
  rm -rf "$TMPDIR"
```

## For any agent working in this repo

- **Before answering Next.js questions** → check `.claude/docs/nextjs/llms.txt` for topic pointers, then load the specific section
- **Before answering NestJS questions** → check `.claude/docs/nestjs/<topic>.md` or `<subdir>/<topic>.md` directly
- **Prefer local docs over training-data knowledge** — these are current, training data is not
- **Cite the doc file path** in recommendations so users can verify
- **If a doc appears outdated** — refresh with the commands above, don't guess
