import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { load, save } from "../lib/localStore";

/* ---------------------------------------------------------
   ChatWidget — the floating help/returns chatbot.

   Works signed out or signed in: anonymous visitors are identified
   by a sessionId generated once and kept in localStorage (same
   pattern CartContext uses for the guest cart); signed-in shoppers
   are identified by their Firebase token, the same way Cart.jsx and
   CheckoutSuccess.jsx authenticate other calls.

   The bot answers on its own until it hands the conversation off to
   the owner. From then on this just polls for the owner's reply —
   there's no push mechanism on the backend.
   --------------------------------------------------------- */

const SESSION_KEY = "natela.chatSession";
const CONVERSATION_KEY = "natela.chatConversation";
const POLL_EVERY_MS = 12000;

function getSessionId() {
  let id = load(SESSION_KEY, null);
  if (!id) {
    id = crypto.randomUUID();
    save(SESSION_KEY, id);
  }
  return id;
}

export default function ChatWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [input, setInput] = useState("");
  const [starting, setStarting] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const bodyRef = useRef(null);
  const sessionId = useRef(getSessionId()).current;

  async function authOptions() {
    if (user) return { token: await user.getIdToken() };
    return { headers: { "X-Session-Id": sessionId } };
  }

  async function ensureConversation() {
    const existingId = load(CONVERSATION_KEY, null);
    if (existingId) {
      try {
        return await api(`/chat/conversations/${existingId}`, { ...(await authOptions()) });
      } catch {
        save(CONVERSATION_KEY, null); // gone or no longer ours — start fresh below
      }
    }
    const created = await api("/chat/conversations", { method: "POST", ...(await authOptions()) });
    save(CONVERSATION_KEY, created.id);
    return created;
  }

  async function openPanel() {
    setOpen(true);
    if (conversation) return;
    setStarting(true);
    setError(null);
    try {
      setConversation(await ensureConversation());
    } catch (err) {
      setError(err.message);
    } finally {
      setStarting(false);
    }
  }

  async function send() {
    const text = input.trim();
    if (!text || sending || !conversation) return;
    setInput("");
    setSending(true);
    setError(null);
    setConversation((c) => ({ ...c, messages: [...c.messages, { role: "user", text }] }));
    try {
      const updated = await api(`/chat/conversations/${conversation.id}/messages`, {
        method: "POST",
        body: { text },
        ...(await authOptions()),
      });
      setConversation(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  // Pick up the owner's reply while handed off and the panel is open.
  useEffect(() => {
    if (!open || !conversation || conversation.status !== "needs_human") return undefined;
    const id = conversation.id;
    const timer = setInterval(async () => {
      try {
        setConversation(await api(`/chat/conversations/${id}`, { ...(await authOptions()) }));
      } catch {
        /* a missed poll just tries again next tick */
      }
    }, POLL_EVERY_MS);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, conversation?.status, conversation?.id]);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [conversation?.messages.length]);

  return (
    <>
      <button className="chat-bubble" onClick={() => (open ? setOpen(false) : openPanel())} aria-label={open ? "Close chat" : "Chat with us"}>
        {open ? (
          "✕"
        ) : (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <circle cx="6" cy="12" r="2.2" />
            <circle cx="12" cy="12" r="2.2" />
            <circle cx="18" cy="12" r="2.2" />
          </svg>
        )}
      </button>

      {open && (
        <div className="chat-panel">
          <div className="chat-panel__head">
            <span className="chat-panel__title">Natela Fit help</span>
            <button className="chat-panel__close" onClick={() => setOpen(false)} aria-label="Close chat">
              ✕
            </button>
          </div>

          <div className="chat-panel__body" ref={bodyRef}>
            {starting && <p className="muted" style={{ fontSize: 13 }}>Connecting…</p>}
            {conversation?.messages.map((m, i) => (
              <div key={i} className={`chat-msg chat-msg--${m.role}`}>
                {m.text}
              </div>
            ))}
          </div>

          {conversation?.status === "needs_human" && (
            <div className="chat-panel__notice">You're connected with our team — they'll reply here.</div>
          )}
          {error && (
            <div className="chat-panel__notice" style={{ color: "var(--brand-red)", borderTopColor: "var(--brand-red)" }}>
              {error}
            </div>
          )}

          <form
            className="chat-panel__form"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <input
              className="fld"
              placeholder="Ask about sizing, shipping or a return…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={starting || sending}
            />
            <button className="btn btn--grad" type="submit" disabled={starting || sending || !input.trim()}>
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}
