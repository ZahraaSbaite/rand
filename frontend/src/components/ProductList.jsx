import ProductCard from "./ProductCard.jsx";

export default function ProductList({ products }) {
  if (!products.length) {
    return <p className="product-grid__empty">No products yet.</p>;
  }

  return (
    <div className="product-grid">
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          colorIndex={index}
        />
      ))}
    </div>
  );
}
