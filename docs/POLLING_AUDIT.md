# FarmEazy Frontend — Polling & Request Lifecycle Audit

Audit date: 2026-08-01. Focus: eliminate duplicate timers and polling replaced by STOMP/SSE.

## Summary

| Category | Expected when live chat open | After fixes |
|----------|------------------------------|-------------|
| Live chat messages | STOMP `/topic/conversation.{id}` | No ticket polling when `useLiveStream` |
| Coin balance | Once per session login-bonus + context fetch | Stable `refreshCoins` + ref guard |
| Notifications | 60s fallback + dropdown fetch | Unchanged (no SSE on user app yet) |
| Legacy tickets | 5s poll only in legacy ticket view | Unchanged |

## Critical fixes applied (request storm)

| Component | API | Trigger | Issue | Fix |
|-----------|-----|---------|-------|-----|
| `CoinContext.jsx` | `GET /coins` | Provider mount | `refreshCoins` new reference every render | `useCallback` on `fetchCoins` |
| `AppShell.jsx` | `POST /coins/login-bonus` | `useEffect([refreshCoins])` | Re-ran on every parent render | `loginBonusClaimedRef` once per session |
| `useLiveSupportChat.js` | `POST /live/conversations/start`, agents-online, messages | `bootstrapLive` deps | Inline `onFallback` destabilized effect | `onFallbackRef` + in-flight guard |
| `useLiveSupportChat.js` | `POST /live/conversations/start` | After each `sendMessage` | Unnecessary API per message | Removed; use STOMP `STATUS` for close |

## Component inventory

### `AppShell.jsx`
- **API:** `POST /coins/login-bonus`, `GET /coins` (via context)
- **Trigger:** mount once (ref guard)
- **Interval:** none
- **Cleanup:** n/a
- **Duplicate risk:** resolved

### `CoinContext.jsx`
- **API:** `GET /coins`
- **Trigger:** mount when token present
- **Interval:** none
- **Cleanup:** n/a

### `ChatSupport.jsx`
- **API:** ticket bootstrap, FAQs, `getUserChatStats` (60s when not live)
- **Trigger:** auth, open, ticketId, `useLiveStream`
- **Interval:** 60s live status (legacy UI only); 5s ticket poll when legacy ticket open and not live
- **Cleanup:** `clearInterval` on both
- **Duplicate risk:** low when live stream active (`useLiveStream` disables polls)

### `NotificationBell.jsx`
- **API:** unread count
- **Trigger:** mount + visibility + 60s interval
- **Cleanup:** yes
- **Note:** candidate for SSE when user notification stream is added

### `AuthContext.jsx`
- **API:** session check
- **Interval:** `SESSION_CHECK_INTERVAL`
- **Cleanup:** yes

### `useSessionTimeout.js`
- **Interval:** session timer
- **Cleanup:** yes

### Other intervals (non-chat)
- `Checkout.jsx` — payment status poll (checkout only)
- `PayoutNotificationPanel.jsx` — 5 min (vendor payout view)
- `Home.jsx` — carousel ticker
- `PremiumFallback.jsx` — tips / redirect timers

## Dependency graph (polling timers)

```
AppShell
  └─ login-bonus (once) → CoinContext.fetchCoins

ChatSupport (single mount in AppShell)
  ├─ useLiveSupportChat (when open + auth)
  │    └─ STOMP connect + subscribe (no poll)
  ├─ ticket poll 5s (legacy ticket only, not live)
  └─ getUserChatStats 60s (widget closed or legacy mode)

NotificationBell
  └─ unread count 60s (visible tab)

AuthContext
  └─ session check interval (global)
```

## Recommendations (next iteration)

1. User-app SSE for notifications → remove `NotificationBell` 60s poll.
2. `PlatformNotificationService` on backend (central publisher).
3. STOMP integration tests for subscription authorization.
4. Chat transfer, unread badges, typing/read receipts (product backlog).

## WebSocket vs polling policy

| Data | Transport |
|------|-----------|
| Chat messages, typing, read, delivered | STOMP |
| Agent presence (customer) | STOMP + optional agents-online on bootstrap |
| Notification badge (user) | Poll 60s today → SSE target |
| Health | Optional 5 min poll |
