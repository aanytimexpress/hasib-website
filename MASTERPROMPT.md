# Master Prompt: Hasibur Rahman Journal (Premium UI + Dual Auth System)

You are a senior full-stack engineer and product designer.

Build and polish **Hasibur Rahman Journal** into a premium Bengali personal publishing platform with:

## Primary Objectives

1. Transform public UI into a professional, emotional, clean, modern journal experience.
2. Implement **two parallel authentication flows**:
   - **User Flow** (Reader/User account)
   - **Admin Flow** (Super Admin / Editor / Moderator)
3. Ensure complete auth lifecycle:
   - Signup
   - Email verification
   - Login
   - Forgot password
   - Reset password
   - Logout
   - Session-aware redirects

## UX Requirements

- Bengali-first readability and typography hierarchy.
- Smooth visual hierarchy, glassmorphism cards, modern spacing, soft gradients.
- Responsive behavior across mobile/tablet/desktop.
- Side-by-side login blocks for User and Admin in a single auth portal.
- Clear status messaging for:
  - unverified email
  - invalid credentials
  - reset email sent
  - password updated
  - unauthorized role for admin dashboard

## Functional Requirements

### User Auth Flow

- `/auth` page contains User Login form.
- `/auth/signup` supports creating new user accounts.
- After signup, show verification instruction and resend verification option.
- `/auth/verify-email` handles verification callback and confirmation UI.
- `/auth/forgot-password` sends reset link.
- `/auth/reset-password` handles token/code and updates password.
- Successful user login redirects to `/account`.

### Admin Auth Flow

- `/auth` page also contains Admin Login form.
- Admin login only allows `super_admin`, `editor`, `moderator` roles.
- Non-admin role should be signed out and shown proper error.
- `/admin/login` should redirect to the same auth portal in admin mode (backward compatibility).

### Session & Routing

- If already logged in:
  - user role -> `/account`
  - admin role -> `/admin`
- Route guards:
  - admin routes require admin roles.
  - account route requires authenticated session.

## Supabase Auth Integration Requirements

- Support email/password signup and sign-in.
- Support verification email resend.
- Support reset password email and password update.
- Handle callback parameters: `code`, `token_hash`, `access_token`, `refresh_token`, `type`.
- Keep compatibility with existing role/profile sync logic in database.

## Quality Bar

- No auth page dead-ends.
- No blank/crash screen when env is missing (graceful fallback).
- All forms with proper validation.
- Clear loading states and disabled buttons during submission.
- Friendly error and success toasts/messages.

## Deliverables

1. New auth pages and route wiring.
2. Updated auth store methods/options for both user/admin flows.
3. Session guards for user and admin sections.
4. Improved UI polish for auth and public layout consistency.
5. Updated README section documenting auth flows.

## Acceptance Criteria

- A new visitor can sign up and verify email.
- A verified user can log in and access `/account`.
- Password reset flow works end-to-end from email link to new login.
- Admin login from same portal correctly routes to `/admin`.
- Non-admin user cannot enter `/admin`.
- Existing admin URL still works.
