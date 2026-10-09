import { useEffect, useState } from "react";
import { api } from "../../lib/api.js";
import { EmptyState, SectionHeader, formatDate, useAdmin } from "./AdminUI.jsx";

export default function MessagesInbox() {
    const { notify, refreshCounts } = useAdmin();
    const [messages, setMessages] = useState(null);
    const [openId, setOpenId] = useState(null);
    const [filter, setFilter] = useState("unread");

    useEffect(() => {
        api("/api/contact")
            .then(setMessages)
            .catch((err) => {
                notify(err.message, "bad");
                setMessages([]);
            });
    }, [notify]);

    const setRead = async (m, is_read) => {
        setMessages((list) => list.map((x) => (x.id === m.id ? { ...x, is_read } : x)));
        try {
            await api(`/api/contact/${m.id}`, { method: "PATCH", body: { is_read } });
            refreshCounts?.();
        } catch (err) {
            notify(err.message, "bad");
        }
    };

    const open = (m) => {
        setOpenId(openId === m.id ? null : m.id);
        if (!m.is_read) setRead(m, true);
    };

    const remove = async (m) => {
        if (!confirm(`Delete the message from ${m.name}?`)) return;
        try {
            await api(`/api/contact/${m.id}`, { method: "DELETE" });
            setMessages((list) => list.filter((x) => x.id !== m.id));
            notify("Message deleted");
            refreshCounts?.();
        } catch (err) {
            notify(err.message, "bad");
        }
    };

    const list = (messages || []).filter((m) => filter === "all" || !m.is_read);
    const unread = (messages || []).filter((m) => !m.is_read).length;

    return (
        <div>
            <SectionHeader title="Messages" description="Everything sent through the Contact page." />

            <div className="admin-tabs" role="tablist">
                <button
                    type="button"
                    role="tab"
                    aria-selected={filter === "unread"}
                    className={`admin-tabs__tab${filter === "unread" ? " is-active" : ""}`}
                    onClick={() => setFilter("unread")}
                >
                    Unread <span>{unread}</span>
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={filter === "all"}
                    className={`admin-tabs__tab${filter === "all" ? " is-active" : ""}`}
                    onClick={() => setFilter("all")}
                >
                    All <span>{(messages || []).length}</span>
                </button>
            </div>

            {messages === null ? (
                <p className="admin-loading">Loading messages…</p>
            ) : list.length === 0 ? (
                <EmptyState title={filter === "unread" ? "No unread messages" : "No messages yet"} />
            ) : (
                <ul className="admin-messages">
                    {list.map((m) => (
                        <li key={m.id} className={`admin-message${m.is_read ? "" : " is-unread"}${openId === m.id ? " is-open" : ""}`}>
                            <button type="button" className="admin-message__summary" onClick={() => open(m)} aria-expanded={openId === m.id}>
                                <span className="admin-message__from">{m.name}</span>
                                <span className="admin-message__subject">
                                    {m.subject || "(no subject)"} — <span className="admin-muted">{m.message}</span>
                                </span>
                                <span className="admin-message__date">{formatDate(m.created_at)}</span>
                            </button>
                            {openId === m.id && (
                                <div className="admin-message__body">
                                    <p className="admin-muted">
                                        From {m.name} &lt;<a href={`mailto:${m.email}`}>{m.email}</a>&gt;
                                    </p>
                                    <p className="admin-message__text">{m.message}</p>
                                    <div className="admin-row">
                                        <a
                                            className="admin-btn admin-btn--small"
                                            href={`mailto:${m.email}?subject=${encodeURIComponent("Re: " + (m.subject || "Your message to RRAND"))}`}
                                        >
                                            Reply by email
                                        </a>
                                        <button type="button" className="admin-btn admin-btn--small admin-btn--ghost" onClick={() => setRead(m, false)}>
                                            Mark unread
                                        </button>
                                        <button type="button" className="admin-link-btn admin-link-btn--danger" onClick={() => remove(m)}>
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
