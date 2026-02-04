# Enterprise-Grade Authentication System

CodeVerse now uses a **MNC-level enterprise authentication system** with advanced security features, replacing Google/GitHub OAuth dependencies.

## 🔒 Security Features

### 1. **Multi-Factor Authentication (MFA/2FA)**
- TOTP-based 2FA using authenticator apps (Google Authenticator, Authy, etc.)
- QR code generation for easy setup
- Backup codes for account recovery
- Optional but recommended for all users

### 2. **Account Security**
- **Account Lockout**: After 5 failed login attempts, account is locked for 30 minutes
- **Failed Login Tracking**: Tracks failed attempts and resets on successful login
- **Password Policies**: 
  - Minimum 8 characters
  - Must contain uppercase, lowercase, and number
  - Bcrypt hashing with cost factor 12

### 3. **Email Verification**
- Email verification required for new accounts
- Verification tokens expire after 24 hours
- Secure token-based verification flow

### 4. **Password Reset**
- Secure password reset via email
- Tokens expire after 1 hour
- Invalidates all existing sessions on password reset
- Resets account lockout status

### 5. **Security Audit Logging**
- Comprehensive audit trail of all security events:
  - Login success/failure
  - MFA enable/disable
  - Password changes
  - Email verification
  - Account lockouts
- Tracks IP address and user agent
- Stored in `security_audit_logs` table

### 6. **Session Management**
- JWT access tokens (15 minutes expiry)
- Refresh tokens (7 days default, 30 days with "Remember Me")
- Automatic token refresh before expiration
- Secure token storage

## 📋 API Endpoints

### Authentication
- `POST /auth/register` - Register new account
- `POST /auth/login` - Login with email/password (supports MFA)
- `POST /auth/logout` - Logout and invalidate refresh token
- `POST /auth/refresh` - Refresh access token

### Email Verification
- `GET /auth/verify-email?token=...` - Verify email address

### Password Reset
- `POST /auth/password/reset-request` - Request password reset
- `POST /auth/password/reset` - Reset password with token

### MFA Management
- `POST /auth/mfa/setup` - Generate MFA secret and QR code (requires auth)
- `POST /auth/mfa/verify` - Verify MFA code and enable MFA (requires auth)
- `POST /auth/mfa/disable` - Disable MFA (requires auth + password + MFA code)

### Magic Link (Passwordless)
- `POST /auth/magic-link/send` - Send passwordless login link
- `GET /auth/magic-link/verify?token=...` - Verify magic link

## 🗄️ Database Schema

### New Tables
- `security_audit_logs` - Security event tracking
- `email_verification_tokens` - Email verification tokens
- `password_reset_tokens` - Password reset tokens

### Updated Tables
- `users` - Enhanced with MFA, account lockout, email verification fields

## 🔐 Security Best Practices Implemented

1. **No Information Disclosure**: Login errors don't reveal if email exists
2. **Rate Limiting**: Strict limits on auth endpoints (20 requests per 15 minutes)
3. **Account Lockout**: Prevents brute force attacks
4. **Secure Token Storage**: Refresh tokens stored in database, not client
5. **Password Hashing**: Bcrypt with high cost factor (12)
6. **Audit Trail**: Complete logging of security events
7. **Session Invalidation**: All sessions invalidated on password reset
8. **MFA Backup Codes**: Secure recovery mechanism

## 📱 Frontend Integration

### Login Flow
1. User enters email/password
2. If MFA enabled, app requests MFA code
3. User enters 6-digit code from authenticator app
4. On success, user is signed in and navigated to home

### MFA Setup Flow
1. User navigates to security settings
2. Initiates MFA setup
3. Scans QR code with authenticator app
4. Enters code to verify and enable MFA
5. Receives backup codes for safekeeping

## 🚀 Migration from OAuth

The system has been migrated from Google/GitHub OAuth to enterprise email/password authentication:

- ✅ Removed OAuth dependencies
- ✅ Enhanced security features
- ✅ MFA support
- ✅ Enterprise-grade audit logging
- ✅ Account protection mechanisms

## 📝 Environment Variables

Required backend environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT signing (min 32 chars in production)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` - Email configuration
- Or `SENDGRID_API_KEY` - For SendGrid email service
- `EMAIL_FROM` - Sender email address
- `APP_URL` - Base URL for email links

## 🔧 Setup Instructions

1. **Update Database**: Run the updated `database/schema.sql` to create new tables
2. **Install Dependencies**: `npm install` in backend directory (adds `otplib`, `qrcode`)
3. **Configure Email**: Set up SMTP or SendGrid for email delivery
4. **Update Frontend**: Remove OAuth buttons, use email/password login
5. **Test MFA**: Users can enable MFA from security settings

## 🎯 Benefits

- **No External Dependencies**: No reliance on Google/GitHub OAuth
- **Full Control**: Complete control over authentication flow
- **Enterprise Security**: MNC-level security features
- **Compliance Ready**: Audit logs for compliance requirements
- **User Privacy**: No third-party data sharing
- **Scalable**: Designed for enterprise scale
