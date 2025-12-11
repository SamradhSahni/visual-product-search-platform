// client/src/pages/Browse.jsx
import { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { listProducts } from "../api/products";

const Browse = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 12,
    pages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Local filter state (synced with URL)
  const params = new URLSearchParams(location.search);
  const initialQuery = params.get("q") || "";
  const initialCategory = params.get("category") || "";
  const initialMinPrice = params.get("minPrice") || "";
  const initialMaxPrice = params.get("maxPrice") || "";
  const initialPage = Number(params.get("page") || 1);

  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [minPrice, setMinPrice] = useState(initialMinPrice);
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
  const [page, setPage] = useState(initialPage);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const payload = {
        page,
        limit: pagination.limit || 12,
      };

      if (query) payload.search = query;
      if (category) payload.category = category;
      if (minPrice !== "") payload.minPrice = minPrice;
      if (maxPrice !== "") payload.maxPrice = maxPrice;

      const data = await listProducts(payload);

      if (data && data.success) {
        setProducts(data.products || []);
        setPagination({
          total: data.pagination?.total || 0,
          page: data.pagination?.page || payload.page,
          limit: data.pagination?.limit || payload.limit,
          pages: data.pagination?.pages || Math.ceil((data.pagination?.total || 0) / (payload.limit || 12)),
        });
      } else {
        setProducts([]);
        setPagination((p) => ({ ...p, pages: 0, total: 0 }));
        setError(data?.message || "Failed to load products");
      }
    } catch (err) {
      console.error("Browse products error:", err?.response || err?.message || err);
      setProducts([]);
      setPagination((p) => ({ ...p, pages: 0, total: 0 }));
      setError(
        err?.response?.data?.message || "Failed to load products. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Keep URL in sync when filters change
  useEffect(() => {
    const newParams = new URLSearchParams();
    if (query) newParams.set("q", query);
    if (category) newParams.set("category", category);
    if (minPrice !== "") newParams.set("minPrice", String(minPrice));
    if (maxPrice !== "") newParams.set("maxPrice", String(maxPrice));
    if (page && page !== 1) newParams.set("page", String(page));

    const searchString = newParams.toString();
    navigate(
      {
        pathname: "/browse",
        search: searchString ? `?${searchString}` : "",
      },
      { replace: true }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, category, minPrice, maxPrice, page]);

  // Fetch products when URL (filters) change
  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    // URL + fetch handled by useEffect
  };

  const clearFilters = () => {
    setQuery("");
    setCategory("");
    setMinPrice("");
    setMaxPrice("");
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    const pages = pagination.pages || 1;
    if (newPage < 1 || newPage > pages) return;
    setPage(newPage);
  };

  return (
    <div style={{ paddingTop: "24px", paddingBottom: "40px" }}>
      <h1 style={{ marginBottom: "4px" }}>Browse products</h1>
      <p style={{ marginBottom: "16px", color: "#9ca3af", fontSize: "0.9rem" }}>
        Use search and filters to discover products from multiple vendors.
      </p>

      {/* Filters + search */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: "grid",
          gridTemplateColumns: "2.2fr 1.4fr 1.4fr 1.4fr auto",
          gap: "10px",
          marginBottom: "14px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "0.8rem" }}>Search</label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Sneakers, dresses, headphones..."
            style={inputStyle}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "0.8rem" }}>Category</label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Shoes, Clothing, Electronics..."
            style={inputStyle}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "0.8rem" }}>Min price</label>
          <input
            type="number"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="0"
            style={inputStyle}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "0.8rem" }}>Max price</label>
          <input
            type="number"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="10000"
            style={inputStyle}
          />
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            justifyContent: "flex-end",
          }}
        >
          <button
            type="submit"
            style={{
              padding: "8px 12px",
              borderRadius: "999px",
              border: "1px solid rgba(148,163,184,0.8)",
              background: "linear-gradient(135deg, #2563eb, #7c3aed)",
              color: "#f9fafb",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
              marginBottom: "4px",
            }}
          >
            {loading ? "Searching..." : "Apply"}
          </button>
          <button
            type="button"
            onClick={clearFilters}
            style={{
              padding: "4px 10px",
              borderRadius: "999px",
              border: "1px solid rgba(148,163,184,0.6)",
              background: "transparent",
              color: "#e5e7eb",
              fontSize: "0.8rem",
              cursor: "pointer",
            }}
          >
            Clear
          </button>
        </div>
      </form>

      {/* Error / loading */}
      {error && (
        <div
          style={{
            backgroundColor: "rgba(239, 68, 68, 0.12)",
            border: "1px solid rgba(248, 113, 113, 0.6)",
            color: "#fecaca",
            padding: "8px 10px",
            borderRadius: "8px",
            marginBottom: "12px",
            fontSize: "0.85rem",
          }}
        >
          {error}
        </div>
      )}

      {/* Products grid */}
      <div
        style={{
          minHeight: "200px",
          backgroundColor: "rgba(15,23,42,0.95)",
          borderRadius: "16px",
          border: "1px solid rgba(148,163,184,0.6)",
          padding: "14px",
        }}
      >
        {loading ? (
          <p style={{ fontSize: "0.9rem", color: "#9ca3af" }}>Loading products...</p>
        ) : products.length === 0 ? (
          <p style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
            No products match your filters yet.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
              gap: "14px",
            }}
          >
            {products.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div
          style={{
            marginTop: "14px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "12px",
            fontSize: "0.85rem",
          }}
        >
          <button
            type="button"
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
            style={pageButtonStyle}
          >
            Previous
          </button>
          <span style={{ color: "#e5e7eb" }}>
            Page {page} of {pagination.pages}
          </span>
          <button
            type="button"
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= pagination.pages}
            style={pageButtonStyle}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

const ProductCard = ({ product }) => {
  const price = Number(product.price) || 0;
  const placeholderInitial = product.title?.[0]?.toUpperCase() || "?";
  const imageUrl = product.imageUrl ? `http://localhost:5000${product.imageUrl}` : null;

  return (
    <Link to={`/product/${product._id}`} style={{ textDecoration: "none", color: "inherit" }}>
      <div
        style={{
          borderRadius: "14px",
          border: "1px solid rgba(148,163,184,0.6)",
          backgroundColor: "rgba(15,23,42,0.9)",
          padding: "8px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          height: "100%",
        }}
      >
        <div
          style={{
            borderRadius: "10px",
            height: "140px",
            background: "radial-gradient(circle at top left, #38bdf8, #4f46e5, #020617)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {imageUrl ? (
            <img src={imageUrl} alt={product.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <span style={{ fontSize: "2rem", fontWeight: 700, color: "#e5e7eb" }}>{placeholderInitial}</span>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: "0.95rem", margin: "6px 0 2px", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
            {product.title}
          </h3>
          <p style={{ fontSize: "0.78rem", color: "#9ca3af", margin: 0, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
            {product.category}
          </p>
        </div>
        <div style={{ marginTop: "6px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem" }}>
          <span style={{ fontWeight: 600 }}>₹ {price.toLocaleString()}</span>
          <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{product.vendor?.name || "Vendor"}</span>
        </div>
      </div>
    </Link>
  );
};

/* ---- Styles used in this component ---- */
const inputStyle = {
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid rgba(148,163,184,0.8)",
  backgroundColor: "rgba(15,23,42,0.6)",
  color: "#e5e7eb",
  fontSize: "0.9rem",
  outline: "none",
};

const pageButtonStyle = {
  padding: "6px 10px",
  borderRadius: 8,
  border: "1px solid rgba(148,163,184,0.6)",
  background: "transparent",
  color: "#e5e7eb",
  cursor: "pointer",
};

export default Browse;
