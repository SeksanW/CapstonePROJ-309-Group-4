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

/* Tappable starter questions under the greeting, until the shopper sends
   their first message. "Where's my order?" leads the bot to ask for the
   order number and checkout email (or look in a signed-in account). */
const PRESET_QUESTIONS = ["Where's my order?", "Help me choose a size", "I'd like to return something"];

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

  /* "New chat": forget this conversation and start a fresh one (greeting
     and preset questions again). The old one stays on the server, so if
     it was handed to the owner they can still see it in the admin. */
  async function resetChat() {
    if (starting || sending) return;
    save(CONVERSATION_KEY, null);
    setConversation(null);
    setInput("");
    setError(null);
    setStarting(true);
    try {
      const created = await api("/chat/conversations", { method: "POST", ...(await authOptions()) });
      save(CONVERSATION_KEY, created.id);
      setConversation(created);
    } catch (err) {
      setError(err.message);
    } finally {
      setStarting(false);
    }
  }

  async function send(preset) {
    const text = (preset ?? input).trim();
    if (!text || sending || !conversation) return;
    if (!preset) setInput("");
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
        {/* Outline speech bubble: brand orange → red line, white inside
            (the --brand-orange / --brand-red hexes; SVG attributes can't
            use CSS vars). Three dots when closed, an ✕ when open. */}
        <svg width="46" height="46" viewBox="0 0 48 48" aria-hidden="true">
          <defs>
            <linearGradient id="chat-bubble-line" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#fbb040" />
              <stop offset="1" stopColor="#e93e3a" />
            </linearGradient>
          </defs>
          <path
            d="M10 7h28a6 6 0 0 1 6 6v15a6 6 0 0 1-6 6H22l-9 8v-8h-3a6 6 0 0 1-6-6V13a6 6 0 0 1 6-6z"
            fill="#fff"
            stroke="url(#chat-bubble-line)"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {open ? (
            <path d="M19 15l10 10M29 15l-10 10" stroke="#e93e3a" strokeWidth="2.5" strokeLinecap="round" />
          ) : (
            <g fill="#e93e3a">
              <circle cx="16" cy="20.5" r="2" />
              <circle cx="24" cy="20.5" r="2" />
              <circle cx="32" cy="20.5" r="2" />
            </g>
          )}
        </svg>
      </button>

      {open && (
        <div className="chat-panel">
          <div className="chat-panel__head">
            <span className="chat-panel__title">Natela Fit help</span>
            <div className="chat-panel__actions">
              <button
                type="button"
                className="chat-panel__new"
                onClick={resetChat}
                disabled={starting || sending || !conversation || conversation.messages.length <= 1}
              >
                New chat
              </button>
              <button className="chat-panel__close" onClick={() => setOpen(false)} aria-label="Close chat">
                ✕
              </button>
            </div>
          </div>

          <div className="chat-panel__body" ref={bodyRef}>
            {starting && <p className="muted" style={{ fontSize: 13 }}>Connecting…</p>}
            {conversation?.messages.map((m, i) => (
              <div key={i} className={`chat-msg chat-msg--${m.role}`}>
                {m.text}
              </div>
            ))}
            {conversation?.status === "bot" && !conversation.messages.some((m) => m.role === "user") && (
              <div className="chat-presets" role="group" aria-label="Suggested questions">
                {PRESET_QUESTIONS.map((q) => (
                  <button key={q} type="button" className="chat-preset" onClick={() => send(q)} disabled={sending}>
                    {q}
                  </button>
                ))}
              </div>
            )}
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
