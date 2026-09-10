import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminProducts from "../components/AdminProducts.jsx";
import AdminOrders from "../components/AdminOrders.jsx";
import AdminReviews from "../components/AdminReviews.jsx";
import AdminContentList from "../components/AdminContentList.jsx";
import "./Admin.css";

const API_URL =
    import.meta.env.VITE_API_URL ?? "http://localhost:4000";

const TABS = [
    { key: "products", label: "Products" },
    { key: "orders", label: "Orders" },
    { key: "journal", label: "Journal" },
    { key: "our-story", label: "Our Story" },
    { key: "process", label: "The Process" },
    { key: "faq", label: "FAQ" },
    { key: "collections", label: "Collections" },
    { key: "reviews", label: "Reviews" },
];

export default function Admin() {
    const [tab, setTab] = useState("products");
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await fetch(`${API_URL}/api/auth/logout`, {
                method: "POST",
                credentials: "include",
            });
        } finally {
            navigate("/admin/login");
        }
    };

    return (
        <main className="admin">
            <div className="admin__header">
                <h1 className="admin__title">Admin</h1>
                <button className="admin__logout" onClick={handleLogout}>
                    Log out
                </button>
            </div>

            <div className="admin__tabs">
                {TABS.map((t) => (
                    <button
                        key={t.key}
                        className={`admin__tab ${tab === t.key ? "admin__tab--active" : ""}`}
                        onClick={() => setTab(t.key)}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === "products" && <AdminProducts />}
            {tab === "orders" && <AdminOrders />}

            {tab === "journal" && (
                <AdminContentList
                    title="Journal"
                    endpoint="journal"
                    itemLabel="entry"
                    fields={[
                        { name: "tag", label: "Tag", required: true, summary: true },
                        { name: "entry_date", label: "Date", type: "date", required: true, summary: true },
                        { name: "title", label: "Title", required: true, summary: true },
                        { name: "sort_order", label: "Order", type: "number" },
                        { name: "image_url", label: "Image URL" },
                        { name: "story", label: "Story", type: "textarea", required: true },
                    ]}
                />
            )}

            {tab === "our-story" && (
                <AdminContentList
                    title="Our Story"
                    endpoint="story-blocks"
                    itemLabel="block"
                    fields={[
                        { name: "heading", label: "Heading", required: true, summary: true },
                        { name: "sort_order", label: "Order", type: "number", summary: true },
                        { name: "image_url", label: "Image URL" },
                        { name: "body", label: "Body", type: "textarea", required: true },
                    ]}
                />
            )}

            {tab === "process" && (
                <AdminContentList
                    title="The Process"
                    endpoint="process-steps"
                    itemLabel="step"
                    fields={[
                        { name: "title", label: "Title", required: true, summary: true },
                        { name: "sort_order", label: "Order", type: "number", summary: true },
                        { name: "description", label: "Description", type: "textarea", required: true },
                    ]}
                />
            )}

            {tab === "faq" && (
                <AdminContentList
                    title="FAQ"
                    endpoint="faqs"
                    itemLabel="question"
                    fields={[
                        { name: "category", label: "Category", required: true, summary: true },
                        { name: "question", label: "Question", required: true, summary: true },
                        { name: "sort_order", label: "Order", type: "number" },
                        { name: "answer", label: "Answer", type: "textarea", required: true },
                    ]}
                />
            )}

            {tab === "collections" && (
                <AdminContentList
                    title="Collections"
                    endpoint="collections"
                    itemLabel="collection"
                    fields={[
                        { name: "name", label: "Name", required: true, summary: true },
                        { name: "slug", label: "Shop category slug", required: true, summary: true },
                        { name: "sort_order", label: "Order", type: "number" },
                        { name: "image_url", label: "Image URL" },
                        { name: "tagline", label: "Tagline", type: "textarea" },
                    ]}
                />
            )}

            {tab === "reviews" && <AdminReviews />}
        </main>
    );
}
