# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest  | Yes       |

## Reporting a Vulnerability

If you discover a security vulnerability in Tenda Pro, please report it **privately** — do not open a public GitHub issue.

**Contact:** rjamscxx@gmail.com

Include in your report:
- Description of the vulnerability and its potential impact
- Steps to reproduce (proof-of-concept if available)
- Affected component(s) and version

**Response timeline:**
- Acknowledgement within 48 hours
- Initial assessment within 5 business days
- Patch release for critical/high findings within 30 days

## Security Controls

### Authentication
- All routes under `/dashboard` require a valid Supabase Auth session (`requireVenue()`).
- Session tokens are managed by `@supabase/ssr` with `HttpOnly`, `Secure`, and `SameSite=Lax` cookie flags.

### Authorization
- Every server action calls `requireVenue()` before touching the database.
- All database queries scope data by `venue_id` derived from the authenticated session — no user-supplied venue IDs.
- Row-Level Security (RLS) is enabled on all Supabase tables as defense-in-depth.

### Input Validation
- Monetary amounts and quantities are validated with Zod schemas in every server action (non-negative, finite, correct type).
- Dish prices require `min(1)` — zero-price entries are rejected.
- Ingredient costs and stock quantities reject negative values and NaN/Infinity.

### Database
- Drizzle ORM with parameterized queries throughout (no string-concatenated SQL).
- `prepare: false` set for Supabase transaction pooler compatibility.
- Connection string stored in `DATABASE_URL` environment variable only.

### API Routes
- Cron endpoints (`/api/cron/*`) require `Authorization: Bearer <CRON_SECRET>` header.
- PayMongo webhook endpoint verified via HMAC signature on every request.
- All API routes guarded by `requireVenue()` or equivalent auth check.

### Secrets
- All credentials stored as environment variables; none committed to source control.
- `.env.local` is in `.gitignore`.

## Incident Response

1. **Detect** — identify scope and affected users
2. **Contain** — rotate compromised credentials immediately
3. **Eradicate** — patch root cause, re-deploy
4. **Notify** — inform affected users within 72 hours if personal data was exposed (GDPR Art. 33)
5. **Recover** — restore from clean state, enhance monitoring
6. **Post-mortem** — document root cause and preventive measures

## Automated Security Scanning

- **CodeQL** runs on every push/PR via GitHub Actions (`.github/workflows/security.yml`)
- **Dependency Review** blocks PRs that introduce high-severity CVEs
- **Dependabot** opens weekly PRs for npm dependency updates
