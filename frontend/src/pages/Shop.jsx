import "./Shop.css";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import ProductList from "../components/ProductList.jsx";
import CategoryStrip from "../components/CategoryStrip.jsx";
import Pagination from "../components/Pagination.jsx";
import useReveal from "../hooks/useReveal.js";
import slugify from "../lib/slug.js";

const API_URL = import.meta.env.VITE_API_URL || "";
const PAGE_SIZE = 5;

const SORTS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "bestselling", label: "Best Selling" },
];

const SORT_COMPARATORS = {
  featured: (a, b) => Number(b.featured) - Number(a.featured) || b.rating - a.rating,
  newest: (a, b) => new Date(b.created_at) - new Date(a.created_at),
  price_asc: (a, b) => a.price_cents - b.price_cents,
  price_desc: (a, b) => b.price_cents - a.price_cents,
  bestselling: (a, b) => Number(b.bestseller) - Number(a.bestseller) || b.review_count - a.review_count,
};

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("featured");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const navigate = useNavigate();
  const { category } = useParams();
  const [searchParams] = useSearchParams();
  const searchQuery = (searchParams.get("search") || "").trim().toLowerCase();
  const selectedCategory = category ? category.toLowerCase() : null;
  const productsRevealRef = useReveal();

  useEffect(() => {
    fetch(`${API_URL}/api/products`)
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedCategory, sort, minPrice, maxPrice, inStockOnly]);

  const categories = useMemo(() => {
    const map = new Map();
    for (const p of products) {
      if (!p.category) continue;
      const key = slugify(p.category);
      if (!map.has(key)) {
        map.set(key, {
          name: key,
          label: p.category.trim().replace(/^./, (c) => c.toUpperCase()),
          image: p.image_url || "https://placehold.co/200x200/f4e2b8/34201a?text=" + encodeURIComponent(p.category.trim()),
        });
      }
    }
    return Array.from(map.values());
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = products;

    if (selectedCategory) {
      result = result.filter(
        (p) => slugify(p.category) === selectedCategory
      );
    }

    if (searchQuery) {
      result = result.filter((p) =>
        p.name.toLowerCase().includes(searchQuery)
      );
    }

    if (minPrice !== "") {
      result = result.filter((p) => p.price_cents >= Number(minPrice) * 100);
    }

    if (maxPrice !== "") {
      result = result.filter((p) => p.price_cents <= Number(maxPrice) * 100);
    }

    if (inStockOnly) {
      result = result.filter((p) => p.stock_quantity > 0);
    }

    return [...result].sort(SORT_COMPARATORS[sort]);
  }, [products, selectedCategory, searchQuery, minPrice, maxPrice, inStockOnly, sort]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const visibleProducts = filteredProducts.slice(start, start + PAGE_SIZE);

  const handleSelectCategory = (name) => {
    navigate(name ? `/shop/${name}` : "/shop");
  };

  const clearFilters = () => {
    setMinPrice("");
    setMaxPrice("");
    setInStockOnly(false);
  };

  const hasActiveFilters = minPrice !== "" || maxPrice !== "" || inStockOnly;

  const emptyMessage = searchQuery
    ? `No pieces matching "${searchParams.get("search")}".`
    : "No pieces match these filters right now.";

  return (
    <main className="shop-page">
      <header className="shop-page__header">
        <p className="shop-page__eyebrow">Curated collection</p>
        <h1 className="shop-page__title">Shop</h1>
        <p className="shop-page__sub">
          Small-batch, handmade pieces — filter by category, price, or availability to find yours.
        </p>
      </header>

      <section className="shop-page__categories" aria-label="Browse categories">
        <CategoryStrip
          categories={categories}
          selected={selectedCategory}
          onSelectCategory={handleSelectCategory}
        />
      </section>

      <section
        className="shop-page__products reveal"
        ref={productsRevealRef}
        aria-label="Shop products"
      >
        <div className="shop-page__toolbar">
          <div className="shop-page__filters">
            <label className="shop-page__price-filter">
              Min $
              <input
                type="number"
                min="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="0"
              />
            </label>
            <label className="shop-page__price-filter">
              Max $
              <input
                type="number"
                min="0"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Any"
              />
            </label>
            <label className="shop-page__checkbox">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
              />
              In stock only
            </label>
            {hasActiveFilters && (
              <button type="button" className="shop-page__clear" onClick={clearFilters}>
                Clear filters
              </button>
            )}
          </div>

          <label className="shop-page__sort">
            Sort by
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {loading ? (
          <p className="shop-page__status">Winding the yarn — loading products…</p>
        ) : filteredProducts.length === 0 ? (
          <p className="shop-page__status">{emptyMessage}</p>
        ) : (
          <>
            <ProductList products={visibleProducts} />
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </>
        )}
      </section>
    </main>
  );
}
