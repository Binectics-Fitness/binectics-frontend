import { describe, expect, it } from "vitest";
import { MessageSide, ReadOnlyReason, type ChatMessage, type MessagesPage, type ThreadState } from "@/lib/api/messaging";
import {
  appendNewer,
  applyServerMessage,
  fromAnchor,
  fromLatest,
  mergeChanges,
  prependOlder,
  upsertMessages,
} from "@/components/messaging/transcriptModel";
import { dayLabel, linkify, listTime, readOnlyCopy, safeHref } from "@/components/messaging/format";
import { renderToStaticMarkup } from "react-dom/server";

const thread: ThreadState = {
  seq: 0,
  rev: 0,
  can_send: true,
  read_only_reason: null,
  can_reply: true,
  can_react: true,
  can_block: false,
  blocked_by_me: false,
  muted: false,
  my_last_read_seq: 0,
  counterpart_last_read_seq: 0,
};

function msg(seq: number, rev = seq, body = `m${seq}`): ChatMessage {
  return {
    _id: `id${seq}`,
    thread_id: "t",
    seq,
    rev,
    client_message_id: null,
    side: MessageSide.THEIRS,
    sender_id: "u",
    author: { kind: "user", user_id: "u", name: "Tunde", avatar_url: null },
    staff_sender: null,
    body,
    created_at: "2026-10-09T09:00:00.000Z",
    edited_at: null,
    deleted_at: null,
    reply_to: null,
    reactions: [],
    editable_until: null,
    can_delete: false,
  };
}

const page = (messages: ChatMessage[], extra: Partial<MessagesPage> = {}): MessagesPage => ({
  messages,
  has_more: false,
  next_rev: Math.max(0, ...messages.map((m) => m.rev)),
  thread,
  ...extra,
});

describe("transcript merge (CONTRACT §6.3)", () => {
  it("upserts by id and keeps the higher rev, sorted by seq", () => {
    const out = upsertMessages([msg(2, 5, "new"), msg(1)], [msg(2, 3, "stale"), msg(3)]);
    expect(out.map((m) => [m.seq, m.body])).toEqual([
      [1, "m1"],
      [2, "new"],
      [3, "m3"],
    ]);
  });

  it("since_rev: updates in place, appends at the tip, absorbs settle-window duplicates", () => {
    const t = fromLatest(page([msg(1), msg(2)]));
    const edited = { ...msg(1, 4, "edited") };
    const { transcript, appended } = mergeChanges(t, page([msg(2), edited, msg(3, 5)], { next_rev: 3 }));
    expect(transcript.messages.map((m) => m.body)).toEqual(["edited", "m2", "m3"]);
    expect(appended.map((m) => m.seq)).toEqual([3]);
    // next_rev never goes backwards, even if a page reports a lower one.
    expect(transcript.nextRev).toBe(3);
    const again = mergeChanges(transcript, page([msg(3, 5)], { next_rev: 2 }));
    expect(again.appended).toEqual([]);
    expect(again.transcript.messages).toHaveLength(3);
    expect(again.transcript.nextRev).toBe(3);
  });

  it("since_rev: a stale copy never overwrites a newer one", () => {
    const t = fromLatest(page([msg(1, 9, "latest")]));
    const { transcript } = mergeChanges(t, page([msg(1, 4, "older")]));
    expect(transcript.messages[0].body).toBe("latest");
  });

  it("since_rev: ignores changes older than the window, flags newer ones when not at the tip", () => {
    const anchored = fromAnchor(page([msg(5), msg(6)], { thread: { ...thread, seq: 20 } }), 20);
    expect(anchored.atTip).toBe(false);
    const { transcript, appended } = mergeChanges(anchored, page([msg(2, 30), msg(21, 31)]));
    expect(transcript.messages.map((m) => m.seq)).toEqual([5, 6]);
    expect(appended).toEqual([]);
    expect(transcript.newerAvailable).toBe(true);
  });

  it("prepends older history and walks newer history to the tip", () => {
    let t = fromLatest(page([msg(3), msg(4)], { has_more: true }));
    t = prependOlder(t, page([msg(1), msg(2)], { has_more: false }));
    expect(t.messages.map((m) => m.seq)).toEqual([1, 2, 3, 4]);
    expect(t.hasOlder).toBe(false);

    let a = fromAnchor(page([msg(1)]), 3);
    a = appendNewer(a, page([msg(2)], { has_more: true }));
    expect(a.atTip).toBe(false);
    a = appendNewer(a, page([msg(3)], { has_more: false }));
    expect(a.atTip).toBe(true);
  });

  it("an action result lands in place; past a non-tip window it only flags newer", () => {
    const t = fromLatest(page([msg(1)]));
    expect(applyServerMessage(t, msg(1, 2, "edited")).messages[0].body).toBe("edited");
    const anchored = fromAnchor(page([msg(1)]), 5);
    expect(applyServerMessage(anchored, msg(9)).newerAvailable).toBe(true);
  });
});

describe("format", () => {
  it("links http and https only, and keeps everything else as inert text (SEC13)", () => {
    const html = renderToStaticMarkup(
      <p>{linkify("see https://example.com/a?b=1. and javascript:alert(1) or <img src=x onerror=alert(1)>")}</p>,
    );
    expect(html).toContain('href="https://example.com/a?b=1"');
    expect(html).toContain('rel="noopener noreferrer nofollow"');
    expect(html).toContain('target="_blank"');
    expect(html).not.toContain('href="javascript');
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
    expect(safeHref("javascript:alert(1)")).toBeNull();
    expect(safeHref("data:text/html,x")).toBeNull();
  });

  it("labels days and inbox times", () => {
    const now = new Date(2026, 9, 9, 18, 0);
    expect(dayLabel(new Date(2026, 9, 9, 8, 0).toISOString(), now)).toBe("Today");
    expect(dayLabel(new Date(2026, 9, 8, 8, 0).toISOString(), now)).toBe("Yesterday");
    expect(dayLabel(new Date(2025, 0, 2, 8, 0).toISOString(), now)).toContain("2025");
    expect(listTime(new Date(2026, 9, 8, 8, 0).toISOString(), now)).toBe("Yesterday");
    expect(listTime(null, now)).toBe("");
  });

  it("uses the shared read-only copy (CONTRACT §11)", () => {
    expect(readOnlyCopy(ReadOnlyReason.RELATIONSHIP_ENDED, "Tunde")).toBe(
      "This conversation has ended. You can still read it, but not send new messages.",
    );
    expect(readOnlyCopy(ReadOnlyReason.BLOCKED, "Tunde")).toBe("You can't send messages in this conversation.");
    expect(readOnlyCopy(ReadOnlyReason.ANNOUNCEMENTS_ONLY, "Dapo Fitness Hub · announcements")).toBe(
      "Only Dapo Fitness Hub can post announcements.",
    );
    expect(readOnlyCopy(ReadOnlyReason.UNAVAILABLE, "x")).toBe(
      "This conversation is no longer available for new messages.",
    );
  });
});
