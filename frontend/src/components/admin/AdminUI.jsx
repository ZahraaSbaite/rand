import { createContext, useCallback, useContext, useRef, useState } from "react";
import { uploadImage } from "../../lib/api.js";
import { getImageUrl } from "../../utils/imageUrl.js";

const AdminContext = createContext(null);

/** Toasts plus a "refresh the sidebar counts" hook shared by every admin section. */
export function AdminProvider({ children, onCountsChange }) {
    const [toasts, setToasts] = useState([]);
    const nextId = useRef(1);

    const notify = useCallback((message, tone = "ok") => {
        const id = nextId.current++;
        setToasts((t) => [...t, { id, message, tone }]);
        setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
    }, []);

    return (
        <AdminContext.Provider value={{ notify, refreshCounts: onCountsChange }}>
            {children}
            <div className="admin-toasts" role="status" aria-live="polite">
                {toasts.map((t) => (
                    <div key={t.id} className={`admin-toast admin-toast--${t.tone}`}>
                        {t.message}
                    </div>
                ))}
            </div>
        </AdminContext.Provider>
    );
}

export function useAdmin() {
    return useContext(AdminContext);
}

export function SectionHeader({ title, description, children }) {
    return (
        <header className="admin-section__header">
            <div>
                <h1 className="admin-section__title">{title}</h1>
                {description && <p className="admin-section__desc">{description}</p>}
            </div>
            {children && <div className="admin-section__actions">{children}</div>}
        </header>
    );
}

export function formatMoney(cents) {
    return `$${(Number(cents || 0) / 100).toFixed(2)}`;
}

export function formatDate(value) {
    if (!value) return "";
    return new Date(value).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

/** Upload an image, or paste a URL; shows a preview and a remove button. */
export function ImageField({ label = "Image", value, onChange }) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);

    const handleFile = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        setUploading(true);
        setError(null);
        try {
            onChange(await uploadImage(file));
        } catch (err) {
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="admin-image-field">
            <span className="admin-field__label">{label}</span>
            <div className="admin-image-field__body">
                <div className="admin-image-field__preview">
                    {value ? (
                        <img src={getImageUrl(value)} alt="" />
                    ) : (
                        <span>No image</span>
                    )}
                </div>
                <div className="admin-image-field__controls">
                    <label className="admin-btn admin-btn--ghost admin-image-field__upload">
                        {uploading ? "Uploading…" : value ? "Replace image" : "Upload image"}
                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            onChange={handleFile}
                            disabled={uploading}
                        />
                    </label>
                    {value && (
                        <button type="button" className="admin-link-btn" onClick={() => onChange("")}>
                            Remove
                        </button>
                    )}
                    {error && <p className="admin-error">{error}</p>}
                </div>
            </div>
        </div>
    );
}

/** Several images: upload adds to the end; first image is the cover. */
export function GalleryField({ label = "Gallery", value = [], onChange }) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);

    const handleFiles = async (e) => {
        const files = [...(e.target.files || [])];
        e.target.value = "";
        if (!files.length) return;
        setUploading(true);
        setError(null);
        try {
            const urls = [];
            for (const file of files) urls.push(await uploadImage(file));
            onChange([...value, ...urls]);
        } catch (err) {
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };

    const move = (from, to) => {
        const next = [...value];
        const [item] = next.splice(from, 1);
        next.splice(to, 0, item);
        onChange(next);
    };

    return (
        <div className="admin-gallery">
            <span className="admin-field__label">{label}</span>
            <div className="admin-gallery__grid">
                {value.map((url, i) => (
                    <figure key={url + i} className="admin-gallery__item">
                        <img src={getImageUrl(url)} alt="" />
                        <figcaption>
                            <button type="button" disabled={i === 0} onClick={() => move(i, i - 1)} aria-label="Move earlier">
                                ‹
                            </button>
                            <button
                                type="button"
                                onClick={() => onChange(value.filter((_, j) => j !== i))}
                                aria-label="Remove image"
                            >
                                Remove
                            </button>
                            <button
                                type="button"
                                disabled={i === value.length - 1}
                                onClick={() => move(i, i + 1)}
                                aria-label="Move later"
                            >
                                ›
                            </button>
                        </figcaption>
                    </figure>
                ))}
                <label className="admin-gallery__add">
                    {uploading ? "Uploading…" : "+ Add photos"}
                    <input
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleFiles}
                        disabled={uploading}
                    />
                </label>
            </div>
            {error && <p className="admin-error">{error}</p>}
        </div>
    );
}

export function StatusPill({ tone = "neutral", children }) {
    return <span className={`admin-pill admin-pill--${tone}`}>{children}</span>;
}

export function EmptyState({ title, children }) {
    return (
        <div className="admin-empty">
            <p className="admin-empty__title">{title}</p>
            {children && <p>{children}</p>}
        </div>
    );
}
