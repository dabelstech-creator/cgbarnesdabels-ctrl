# Firestore Security Specification

## Data Invariants
1. A user profile (`/users/{userId}`) can only be created, read, or updated by the user themselves.
2. System logs (`/logs/{logId}`) can be read and written by any authenticated user (for system telemetry and audit trails).
3. Biometric data (`/biometrics/{bioId}`) can be read and written by any authenticated user (shared telemetry in this workspace).

## The Dirty Dozen Payloads
1. Attempt to read another user's profile.
2. Attempt to write to a user profile with a different UID than the auth UID.
3. Attempt to write a log entry without being signed in.
4. Attempt to write a log entry with extra "ghost" fields (e.g., `isVerified: true`).
5. Attempt to delete a log entry without being signed in.
6. Attempt to read biometric data without being signed in.
7. Attempt to write biometric data with a 1MB string in `activity`.
8. Attempt to update a biometric record once it has been created (immutability).
9. Attempt to create a user profile with a 10KB displayName.
10. Attempt to spoof a server timestamp in `logs`.
11. Attempt to delete all logs in a single request (batch).
12. Attempt to list users (should be denied).

## Proposed Hardened Rules
- Use `isValidUser`, `isValidLog`, `isValidBiometric` helpers.
- Enforce `.size()` checks on strings.
- Enforce `request.time` for timestamps.
- Default deny all.
