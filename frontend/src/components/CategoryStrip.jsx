import { useRef } from "react";
import { getImageUrl } from "../utils/imageUrl.js";
import "./CategoryStrip.css";

export default function CategoryStrip({ categories, selected, onSelectCategory }) {
    const scrollRef = useRef(null);

    if (!categories.length) return null;

    const scrollBy = (amount) => {
        scrollRef.current?.scrollBy({ left: amount, behavior: "smooth" });
    };

    return (
        <div className="category-strip-wrapper">
            <button
                className="category-strip__arrow category-strip__arrow--left"
                onClick={() => scrollBy(-240)}
                aria-label="Scroll categories left"
            >
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>

            <nav className="category-strip" ref={scrollRef}>
                <button
                    className={`category-strip__item ${!selected ? "category-strip__item--active" : ""}`}
                    onClick={() => onSelectCategory(null)}
                >
                    <div className="category-strip__circle category-strip__circle--all">All</div>
                    <span>All</span>
                </button>

                {categories.map((cat) => (
                    <button
                        key={cat.name}
                        className={`category-strip__item ${selected === cat.name ? "category-strip__item--active" : ""}`}
                        onClick={() => onSelectCategory(cat.name)}
                    >
                        <img className="category-strip__circle" src={getImageUrl(cat.image)} alt={cat.name} />
                        <span>{cat.label}</span>
                    </button>
                ))}
            </nav>

            <button
                className="category-strip__arrow category-strip__arrow--right"
                onClick={() => scrollBy(240)}
                aria-label="Scroll categories right"
            >
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>
        </div>
    );
}