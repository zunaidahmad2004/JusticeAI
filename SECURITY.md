# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| latest (main) | ✅ |

## Reporting a Vulnerability

**Please do NOT report security vulnerabilities through public GitHub issues.**

If you discover a security vulnerability in JusticeAI, please report it responsibly:

1. **Email**: Create a private security advisory on GitHub
2. Go to [Security Advisories](https://github.com/zunaidahmad2004/JusticeAI/security/advisories/new)
3. Describe the vulnerability in detail

### What to Include

- Type of vulnerability
- Full path of the affected file(s)
- Location of the affected source code
- Any special configuration required to reproduce
- Step-by-step instructions to reproduce
- Proof-of-concept or exploit code (if possible)
- Impact of the vulnerability

### Response Timeline

- **Acknowledgement**: Within 48 hours
- **Initial Assessment**: Within 5 business days
- **Resolution**: Depends on severity

## Security Measures in This Project

- **Authentication**: JWT with refresh token rotation
- **Password Storage**: bcrypt hashing (salt rounds: 12)
- **Rate Limiting**: 300 req/15min general, 20 req/min AI routes
- **Security Headers**: Helmet.js with custom CSP
- **CORS**: Restricted to configured origins only
- **Input Validation**: All inputs sanitized before processing
- **Environment Variables**: All secrets in env vars, never hardcoded
- **HTTPS**: Enforced in production via Render

## Security Best Practices for Deployers

1. Use strong, unique values for `JWT_SECRET` and `JWT_REFRESH_SECRET` (min 32 chars)
2. Never commit `.env` files to version control
3. Regularly rotate API keys and secrets
4. Keep all dependencies updated
5. Use MongoDB Atlas with network access restrictions
6. Enable 2FA on your Render and GitHub accounts
