# Security Specification - Bazaar Support System

## Data Invariants
1. **Support Thread Identity**: A thread ID must either match the authenticated user's UID or follow the `guest_` prefix pattern.
2. **Message Integrity**: Every message must include a valid `threadId`, `text` (1-5000 chars), and a recognized `sender` ('user', 'bot', 'admin').
3. **Relational Sync**: A `support_message` should ideally only be created if the corresponding `support_thread` exists or is created in the same batch (though for now, we'll focus on ownership).
4. **Ownership Persistence**: The `userId` of a thread and the `threadId` of its messages are immutable once set.
5. **Verified Access**: Authenticated users must have a verified email to interact with support.

## The "Dirty Dozen" Payloads (Support Bypass Attempts)
1. **Identity Spoofing**: Logged-in user A tries to create a message with `threadId` of user B.
2. **Admin Spoofing**: Authenticated user tries to set `sender: 'admin'`.
3. **Guest Poisoning**: Malicious user tries to create a message with a huge ID or non-matches pattern.
4. **Schema Injection**: Payload with extra "ghost fields" like `isVerified: true`.
5. **Empty Message**: Message with `text.size() == 0`.
6. **Giant Message**: Message with `text.size() > 5000`.
7. **Thread Hijacking**: User tries to update someone else's support thread status.
8. **Internal State Leak**: User tries to read private admin notes in a thread (if they existed).
9. **Timestamp Manipulation**: Client tries to send a back-dated or future `timestamp`.
10. **Role Escalation**: Guest tries to send a message with `sender: 'bot'`.
11. **Orphaned Message**: Creating a message for a non-existent guest thread ID.
12. **Status Lock-in Bypass**: Trying to update a `closed` thread without admin rights.

## Test Strategy
All payloads above should return `PERMISSION_DENIED` unless explicitly authorized (e.g., admin).
