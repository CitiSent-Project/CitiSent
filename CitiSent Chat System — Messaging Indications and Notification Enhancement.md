# CitiSent Chat System — Messaging Indications and Notification Enhancement

## Context

We already have a working chat system in the CitiSent website.

The current architecture has **two ways to access the same conversation system**:

1. **Conversations page**
   - Dedicated admin communication workspace.
   - Left side contains the conversation list.
   - Right side contains the selected conversation/thread.
   - Displays the user, report reference, messages, AI-assisted reply suggestions, and message composer.
   - The conversation header has a `View Report` action.

2. **Reports page → Chat Drawer**
   - Reports have a `Talk to User` button.
   - Clicking it opens a chat drawer without leaving the report detail page.
   - This is intended as a contextual/quick communication interface.
   - The drawer and Conversations page should use the same underlying conversation/message data.

Do **not** rebuild the existing chat system from scratch.

Instead, inspect the existing implementation and extend it cleanly.

---

# Main Objective

Upgrade the existing chat system with a modern, minimal, user-friendly messaging indication system.

The following features are currently missing and need to be implemented:

- Conversation list unread indicators
- New-message indicators
- Online/offline status
- Last-message preview
- Unread counts
- Chat drawer indications
- Conversation ordering
- Notifications/toasts
- Read/unread state behavior

The final system should feel similar to a modern professional communication application, while still fitting CitiSent's existing admin dashboard design.

---

# IMPORTANT IMPLEMENTATION RULE

Before changing anything:

1. Inspect the existing frontend architecture.
2. Inspect the existing chat components.
3. Inspect the existing API/backend implementation.
4. Inspect the existing database/schema related to conversations and messages.
5. Determine how messages are currently fetched, sent, and stored.
6. Determine whether real-time updates already exist.
7. Reuse existing services, hooks, API functions, database structures, and components whenever possible.
8. Do not duplicate conversation/message logic between the Conversations page and Report Chat Drawer.
9. Do not introduce a second independent chat state system.
10. Do not remove existing functionality that already works.

If the existing backend already supports some of these features, extend it instead of creating a parallel implementation.

---

# 1. Conversation List Unread Indicators

Update the Conversations page's left-side conversation list.

Currently, conversations look approximately like:

```text
Jane Doe
No messages yet
Civic Issues
```

The conversation list should instead provide useful messaging information.

Example:

```text
┌──────────────────────────────────────┐
│ 🔵  Jane Doe                     2m │
│     Thank you for the update...  ●  │
│     Civic Issues                    │
└──────────────────────────────────────┘
```

For an unread conversation:

```text
┌──────────────────────────────────────┐
│ 🔵  Jane Doe                    Now │
│     Are you able to check this?  ●2 │
│     Civic Issues                    │
└──────────────────────────────────────┘
```

Requirements:

- Clearly distinguish conversations containing unread messages.
- Use a subtle unread indicator.
- Avoid huge or distracting badges.
- Show the unread count when greater than 1.
- A conversation with no unread messages should not display an unread badge.
- The unread state must come from actual message/read state, not hardcoded frontend values.

---

# 2. Last-Message Preview

Replace the current generic:

```text
No messages yet
```

when messages exist.

Instead, show the most recent message.

Example:

```text
Jane Doe
Thank you for the update...
Civic Issues
```

If the latest message was sent by the admin, make the distinction clear but subtle:

```text
Jane Doe
You: We'll investigate this today.
Civic Issues
```

Requirements:

- Display the latest message for each conversation.
- Truncate long messages so the conversation list remains compact.
- Preserve the existing visual hierarchy.
- Do not allow long messages to expand the conversation card.
- If there are genuinely no messages, keep:

```text
No messages yet
```

---

# 3. Conversation Ordering

Conversations should automatically be ordered by recent activity.

Expected behavior:

```text
Most recently active
        ↓
Older conversations
        ↓
Inactive conversations
```

Example:

```text
Jane Doe       2 minutes ago
Mark Santos    15 minutes ago
John Cruz      Yesterday
Maria Reyes    3 days ago
```

If a user sends a new message:

```text
Jane Doe
```

should automatically move toward the top of the conversation list.

If possible, unread conversations should also receive visual priority.

Do not use arbitrary ordering based only on creation date.

Use the latest relevant conversation/message activity timestamp.

---

# 4. Unread Counts

Implement unread message counts per conversation.

Example:

```text
Jane Doe
Are you able to check this?
                         ● 3
```

Requirements:

- Count only messages that the current admin has not read.
- Do not count messages sent by the current admin as unread.
- Counts should update when new messages arrive.
- Opening a conversation should mark the appropriate messages as read.
- The count should disappear when there are no unread messages.
- Avoid displaying `0`.

If a global unread count is useful for the Conversations navigation item, it may also be displayed:

```text
Conversations                         4
```

Only implement this if it fits the existing sidebar design.

---

# 5. Read / Unread State Behavior

Implement a proper read-state lifecycle.

Expected behavior:

### New incoming message

```text
message arrives
      ↓
conversation becomes unread
      ↓
unread count increases
      ↓
conversation receives visual indicator
```

### Admin opens the conversation

```text
conversation opened
      ↓
visible unread messages become read
      ↓
unread count decreases/disappears
```

### Admin is already viewing the conversation

If a new message arrives while the admin is actively viewing the conversation:

- Do not unnecessarily show a global notification.
- Do not increase the unread count if the message is immediately visible/read.
- If the admin has scrolled away from the bottom, treat the message appropriately as a new message and show the new-message indicator.

### Important

Do not automatically mark every message as read merely because the conversation page exists.

Reading should be tied to actual conversation visibility/user interaction where practical.

---

# 6. New Message Indicator Inside Chat

If the admin is currently inside a conversation but is reading older messages, do not force the chat to scroll to the bottom.

Instead, display a floating indicator:

```text
┌──────────────────────┐
│ ↓ 2 New messages     │
└──────────────────────┘
```

Requirements:

- Show when new messages arrive while the user is not at the bottom.
- Clicking the indicator scrolls smoothly to the newest message.
- The indicator disappears once the user reaches the newest messages.
- Do not disrupt the user's current scroll position.

This is especially important for long conversations.

---

# 7. Online / Offline Status

Add a minimal user presence indicator to the conversation header.

Example:

```text
Jane Doe
● Online
```

Offline:

```text
Jane Doe
○ Offline
```

If a real presence system already exists, use it.

If there is no presence infrastructure:

1. Inspect whether the current architecture can support presence.
2. Prefer an existing connection/heartbeat mechanism if available.
3. Do not fake online status permanently.
4. If true real-time presence cannot be reliably implemented with the current architecture, implement a reasonable `last seen` mechanism instead.

Example:

```text
Jane Doe
Last seen 8 minutes ago
```

The presence indicator should be subtle and should not dominate the conversation header.

---

# 8. Chat Drawer Indications

The existing `Talk to User` button inside Reports should reflect conversation activity.

Current concept:

```text
Talk to User
```

Enhance it to support unread state:

```text
💬 Talk to User   ●
```

or:

```text
💬 Talk to User   ● 2
```

Requirements:

- Show an unread indicator if the report's conversation contains unread messages.
- Display the unread count where appropriate.
- Remove the indicator once the relevant messages are read.
- The drawer must use the same conversation/message state as the main Conversations page.
- Do not create separate unread state logic for the drawer.

---

# 9. Chat Drawer — New Message Behavior

When the admin has the Report Chat Drawer open:

### If the admin is at the bottom

A new message should appear naturally.

Do not create an unnecessary notification.

### If the admin is reading older messages

Show:

```text
↓ 1 New message
```

or:

```text
↓ 3 New messages
```

Do not force-scroll the user to the bottom.

### If the drawer is closed

The `Talk to User` button should display the unread indication.

Example:

```text
┌───────────────────────────┐
│ 💬 Talk to User      ● 2 │
└───────────────────────────┘
```

---

# 10. Notifications / Toasts

Implement a subtle toast notification for incoming messages when the admin is not actively viewing that conversation.

Example:

```text
┌────────────────────────────────────┐
│ 💬 New message                     │
│                                    │
│ Jane Doe                           │
│ "Thank you for the update..."      │
│                                    │
│                          View →    │
└────────────────────────────────────┘
```

Requirements:

- Use the existing notification/toast system if one exists.
- Do not introduce a second toast library unnecessarily.
- Toast should appear in a non-disruptive location, preferably bottom-right.
- It should automatically disappear after a reasonable amount of time.
- Include:
  - Sender
  - Message preview
  - Relevant report/conversation context when useful
  - Action to open/view the conversation
- Clicking `View` should navigate/open the correct conversation.
- Do not show a toast for the admin's own messages.
- Do not show a duplicate toast if the admin is already actively viewing that conversation.

---

# 11. Conversations Page ↔ Reports Page Synchronization

This is extremely important.

The following must represent the SAME underlying conversation:

```text
Conversations Page
        ↕
   Conversation
        ↕
Report Chat Drawer
        ↕
     Report
```

Example:

If Jane Doe sends:

```text
"Can you provide an update?"
```

while the admin is on the Reports page:

1. The conversation should become unread.
2. The relevant conversation in the Conversations list should update.
3. The latest-message preview should update.
4. The unread count should increase.
5. The `Talk to User` button should show an unread indicator.
6. A toast should appear if the admin is not viewing the conversation.
7. Opening the conversation should mark it read.
8. The unread indicators should disappear/update everywhere.

There must not be inconsistent states between the Conversations page and Reports page.

---

# 12. Real-Time Updates

Inspect the current architecture and determine how real-time messaging is implemented.

If the project already uses:

- WebSockets
- Supabase Realtime
- Socket.IO
- Server-Sent Events
- polling
- another real-time mechanism

reuse the existing mechanism.

Do not introduce another real-time technology unless absolutely necessary.

New messages should update relevant UI elements without requiring a full page refresh.

At minimum, real-time updates should affect:

- Current message thread
- Conversation list
- Last-message preview
- Unread count
- Unread indicator
- Conversation ordering
- Chat drawer indicator
- Toast notification

---

# 13. Loading and Error States

Make sure these new states do not cause UI instability.

Support:

```text
Loading conversations...
Loading messages...
```

and appropriate empty/error states.

If the real-time connection is lost, use the existing connection indicator if available.

Do not make the UI crash because presence, unread state, or notification data is temporarily unavailable.

---

# 14. Visual Design Requirements

The current CitiSent UI uses a clean blue/white administrative dashboard design.

Keep the existing design language.

The new features should be:

- Minimal
- Professional
- Compact
- Easy to scan
- Responsive
- Consistent with existing spacing
- Consistent with existing border radius
- Consistent with existing typography
- Consistent with existing colors

Avoid:

- Large notification banners
- Excessive animations
- Excessive badges
- Bright flashing indicators
- Red indicators for normal unread messages unless the existing design already uses red
- Messenger-style decorative UI
- Unnecessary icons
- Rebuilding existing components just for styling

The notification system should feel like a **professional admin communication tool**.

---

# 15. Accessibility

Do not rely only on color.

For example, an unread conversation should have:

- Visual weight change
- Unread badge/count
- Accessible label if necessary

Example:

```text
Jane Doe — 2 unread messages
```

Buttons and indicators should have appropriate accessible labels/tooltips where needed.

---

# 16. Suggested Component Responsibilities

Reuse existing components where possible.

If the current structure allows it, organize functionality approximately like:

```text
Conversations
│
├── ConversationList
│   ├── ConversationItem
│   ├── UnreadBadge
│   └── LastMessagePreview
│
└── ConversationThread
    ├── ChatHeader
    │   └── PresenceStatus
    ├── MessageList
    │   └── NewMessageIndicator
    └── MessageComposer


Reports
│
└── ReportChatDrawer
    ├── ChatHeader
    │   └── PresenceStatus
    ├── MessageList
    │   └── NewMessageIndicator
    └── MessageComposer


Global
│
└── ChatNotificationToast
```

Do not create these exact components if equivalent components already exist.

Inspect the existing codebase first.

---

# 17. Data Model

Inspect the existing database before modifying it.

Determine whether the current schema already contains fields equivalent to:

```text
message_id
conversation_id
sender_id
created_at
read_at
```

If possible, use a `read_at` or equivalent timestamp-based approach rather than maintaining unnecessary boolean state.

For example:

```text
read_at = null
```

means unread.

```text
read_at = timestamp
```

means read.

However, **do not blindly add this exact schema**.

Use whatever data model best fits the existing project architecture.

If a database migration is required:

1. Create the migration.
2. Update backend logic.
3. Update frontend logic.
4. Preserve existing messages.
5. Do not break existing conversations.

---

# 18. Backend Requirements

Inspect existing APIs/services.

If required, implement endpoints or service methods for:

- Getting conversation unread count
- Marking messages as read
- Getting latest message
- Getting conversation activity timestamp
- Updating/read tracking
- Presence/last-seen information if supported

Do not duplicate API calls unnecessarily.

Prefer returning conversation metadata efficiently so the conversation list does not require a separate request for every conversation.

Avoid an N+1 query pattern.

---

# 19. Performance Requirements

The Conversations page may contain many conversations.

Do not perform:

```text
1 API request per conversation
```

just to determine:

- latest message
- unread count
- activity timestamp

Prefer a single optimized query/API response that provides the required conversation summary information.

Conversation list data should ideally contain something similar to:

```javascript
{
  conversationId,
  user,
  report,
  lastMessage,
  lastMessageAt,
  unreadCount,
  isOnline
}
```

Adapt this to the actual project architecture.

---

# 20. Conversation Summary Example

The final conversation item should conceptually provide:

```text
┌──────────────────────────────────────┐
│ 🔵  Jane Doe                    2m  │
│     You: We'll investigate this...  │
│     Civic Issues              ● 2   │
└──────────────────────────────────────┘
```

Another:

```text
┌──────────────────────────────────────┐
│ 🟣  Mark Santos                1h  │
│     Thank you for your response.    │
│     Garbage Collection               │
└──────────────────────────────────────┘
```

No unread state:

```text
┌──────────────────────────────────────┐
│ 🔵  Maria Reyes                3h  │
│     You: Your report has been...    │
│     Civic Issues                    │
└──────────────────────────────────────┘
```

---

# 21. Acceptance Criteria

The implementation is considered complete when:

### Conversation List

- [ ] Each conversation displays its latest message.
- [ ] Long message previews are truncated.
- [ ] Conversations are ordered by recent activity.
- [ ] Unread conversations are visually distinguishable.
- [ ] Unread counts are displayed correctly.
- [ ] Unread counts disappear when messages are read.
- [ ] Conversations update without requiring a full page refresh.

### Conversation Thread

- [ ] New incoming messages appear without refreshing.
- [ ] New-message indicator appears when the user is reading older messages.
- [ ] The chat does not unexpectedly force-scroll.
- [ ] Opening/reaching the relevant messages updates read state appropriately.
- [ ] Message state remains consistent after navigation.

### Presence

- [ ] Online/offline or last-seen status is displayed where reliably supported.
- [ ] Presence does not interfere with the chat layout.

### Reports Chat Drawer

- [ ] `Talk to User` displays an unread indicator when appropriate.
- [ ] Unread count is consistent with the Conversations page.
- [ ] New messages update the drawer in real time.
- [ ] The drawer supports the same read/unread behavior as the Conversations page.
- [ ] Closing the drawer does not incorrectly mark unrelated messages as read.

### Notifications

- [ ] Incoming messages can produce a toast when appropriate.
- [ ] Own messages do not generate notifications.
- [ ] Messages in the currently active conversation do not create duplicate notifications.
- [ ] Toast includes enough context to identify the conversation.
- [ ] Clicking the toast opens the correct conversation/report.

### Synchronization

- [ ] Conversations page and Reports page use the same underlying message/read state.
- [ ] Sending a message from either interface updates the other.
- [ ] Unread counts remain consistent across both interfaces.
- [ ] Last-message previews remain consistent.
- [ ] Conversation ordering updates consistently.

---

# 22. Important: Preserve Existing Features

Do NOT remove or break:

- Existing Conversations page
- Existing conversation selection
- Existing message sending
- Existing message history
- Existing AI-assisted reply suggestions
- Existing `View Report` functionality
- Existing `Talk to User` functionality
- Existing Report Chat Drawer
- Existing report status functionality
- Existing authentication/authorization
- Existing report ownership/access restrictions
- Existing backend security
- Existing UI styling unless modification is necessary

The goal is to **enhance the current system**, not replace it.

---

# 23. Development Process

Work in this order:

## Phase 1 — Inspect

Inspect the repository and identify:

- Conversation components
- Chat drawer components
- Message components
- Conversation API/service
- Message API/service
- Database schema
- Real-time implementation
- Authentication/user identity
- Existing notification/toast system

Before making changes, summarize what you found.

## Phase 2 — Plan

Create a concise implementation plan based on the actual codebase.

Identify:

- Files that need modification
- Files that need to be created
- Database changes, if any
- API changes, if any
- State-management changes
- Real-time changes

Do not assume file names from this prompt if the repository uses different names.

## Phase 3 — Implement

Implement the features incrementally.

Prioritize:

1. Last-message preview
2. Conversation ordering
3. Read/unread state
4. Unread counts
5. Conversation list indicators
6. New-message indicators
7. Chat drawer indicators
8. Notifications/toasts
9. Online/offline/last-seen status

## Phase 4 — Verify

Run the appropriate:

- Tests
- Linting
- Type checking, if applicable
- Build
- Existing project validation commands

Fix regressions before finishing.

---

# 24. Final UX Goal

The finished system should communicate:

> "There is something new here"

without screaming:

> "YOU HAVE A NEW MESSAGE!"

The visual hierarchy should be subtle.

A good final experience should look approximately like:

```text
Conversations

┌──────────────────────────────────────┐
│ 🔵 Jane Doe                     2m │
│    Thank you for the update...   ●2 │
│    Civic Issues                    │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ 🔵 Mark Santos                 15m │
│    You: We'll investigate this...  │
│    Garbage Collection              │
└──────────────────────────────────────┘
```

And inside the conversation:

```text
┌──────────────────────────────────────┐
│ ← Jane Doe                       ⋮  │
│   ● Online                          │
├──────────────────────────────────────┤
│                                      │
│ Jane                                 │
│ Are you able to check this?          │
│                                      │
│                         You          │
│                         Yes, we're   │
│                         investigating│
│                         it now.      │
│                                      │
│        ┌──────────────────────┐      │
│        │ ↓ 2 New messages     │      │
│        └──────────────────────┘      │
│                                      │
├──────────────────────────────────────┤
│ Type a message...               ➤   │
└──────────────────────────────────────┘
```

And inside a Report:

```text
┌──────────────────────────────┐
│ Report Details               │
│                              │
│ Status: Under Investigation  │
│                              │
│ 💬 Talk to User         ● 2 │
└──────────────────────────────┘
```

The core principle is:

**One conversation system, two entry points.**

The Conversations page is the **full communication workspace**.

The Report Chat Drawer is the **contextual communication interface**.

Both must remain synchronized and use the same underlying message, unread, read, and notification state.