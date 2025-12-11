// client/src/pages/ProductDetails.jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getProductById,
  getSimilarProducts,
  registerProductView,
} from "../api/products";
import { recordUserView } from "../api/activity";
import { useAuth } from "../context/AuthContext";
import { addToCart } from "../api/cart";


const ProductDetails = () => {
  const { user } = useAuth();
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [similarProducts, setSimilarProducts] = useState([]);
  const [similarLoading, setSimilarLoading] = useState(false);
  const [similarError, setSimilarError] = useState(null);

  // Load main product
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getProductById(id);
        if (data.success) {
          setProduct(data.product);
          // register a view (analytics / trending)
          registerProductView(id);
          if(user && user._id){
            try{
              recordUserView(data.product._id);
            }
            catch(e){
              console.warn("recordUserView failed:", e);
            }
          }
        } else {
          setError(data.message || "Failed to load product.");
        }
      } catch (err) {
        console.error("Product details error:", err.response || err.message);
        setError(
          err.response?.data?.message || "Failed to load product. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  // Load similar products once we have the main product
  useEffect(() => {
    if (!product) return;
    (async () => {
      const res = await getSimilarProducts(product._id, 8);
      if (res.success) setSimilarProducts(res.products);
    })();
  }, [product]);

  if (loading) {
    return (
      <div style={{ paddingTop: "40px", textAlign: "center" }}>
        Loading product...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ paddingTop: "40px", maxWidth: "600px", margin: "0 auto" }}>
        <h1>Product details</h1>
        <p
          style={{
            marginTop: "12px",
            color: "#fecaca",
            backgroundColor: "rgba(239, 68, 68, 0.12)",
            border: "1px solid rgba(248, 113, 113, 0.6)",
            padding: "10px 12px",
            borderRadius: "10px",
            fontSize: "0.9rem",
          }}
        >
          {error}
        </p>
        <p style={{ marginTop: "12px" }}>
          <Link to="/browse" style={{ color: "#93c5fd" }}>
            Go back to browse
          </Link>
        </p>
      </div>
    );
  }

  if (!product) return null;

  const price = Number(product.price) || 0;
  const placeholderInitial = product.title?.[0]?.toUpperCase() || "?";
  const imageUrl = product.imageUrl
    ? `http://localhost:5000${product.imageUrl}`
    : null;

  return (
    <div style={{ paddingTop: "24px", paddingBottom: "40px" }}>
      <Link to="/browse" style={{ color: "#93c5fd", fontSize: "0.85rem" }}>
        ← Back to browse
      </Link>

      <div
        style={{
          marginTop: "12px",
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.3fr) minmax(0, 1.5fr)",
          gap: "24px",
        }}
      >
        {/* Left: Image */}
        <section
          style={{
            borderRadius: "18px",
            border: "1px solid rgba(148,163,184,0.6)",
            backgroundColor: "rgba(15,23,42,0.95)",
            padding: "16px",
            minHeight: "260px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <div
            style={{
              borderRadius: "12px",
              flex: 1,
              background:
                "radial-gradient(circle at top left, #38bdf8, #4f46e5, #0f172a)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={product.title}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <span
                style={{
                  fontSize: "3rem",
                  fontWeight: 800,
                  color: "#e5e7eb",
                }}
              >
                {placeholderInitial}
              </span>
            )}
          </div>
          <p style={{ fontSize: "0.8rem", color: "#9ca3af", margin: 0 }}>
            {imageUrl
              ? "Main product image uploaded by the vendor."
              : "No image uploaded yet. This will show the product image when available."}
          </p>
        </section>

        {/* Right: Info */}
        <section>
          <h1 style={{ marginTop: 0, marginBottom: "4px" }}>{product.title}</h1>
          <p
            style={{
              marginTop: 0,
              marginBottom: "8px",
              fontSize: "0.9rem",
              color: "#9ca3af",
            }}
          >
            Category:{" "}
            <span style={{ color: "#e5e7eb" }}>{product.category}</span>
          </p>

          <div
            style={{
              fontSize: "1.3rem",
              fontWeight: 700,
              marginBottom: "8px",
            }}
          >
            ₹ {price.toLocaleString()}
          </div>

          <p
            style={{
              marginTop: 0,
              marginBottom: "6px",
              fontSize: "0.85rem",
              color: "#9ca3af",
            }}
          >
            Sold by:{" "}
            <span style={{ color: "#e5e7eb" }}>
              {product.vendor?.name || "Vendor"}
            </span>
          </p>
          <p
            style={{
              marginTop: 0,
              marginBottom: "10px",
              fontSize: "0.85rem",
              color: product.stock > 0 ? "#bbf7d0" : "#fecaca",
            }}
          >
            {product.stock > 0
              ? `${product.stock} in stock`
              : "Out of stock"}
          </p>

          <p
            style={{
              fontSize: "0.9rem",
              color: "#e5e7eb",
              marginTop: "10px",
              whiteSpace: "pre-line",
            }}
          >
            {product.description}
          </p>

          {/* Placeholder cart / wishlist buttons; actual cart comes later */}
          <div style={{ marginTop: "14px", display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={async () => {
                try {
                  await addToCart(product._id, 1);
                  alert("Added to cart");
                } catch (err) {
                  console.error(err);
                  alert("Failed to add");
                }
              }}
              style={{
                padding: "10px 18px",
                borderRadius: "999px",
                border: "none",
                background:
                  "linear-gradient(135deg, #22c55e, #16a34a)",
                color: "#0f172a",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: "0.9rem",
              }}
            >
              Add to cart
            </button>
            <button
              type="button"
              style={{
                padding: "10px 18px",
                borderRadius: "999px",
                border: "1px solid rgba(148,163,184,0.8)",
                background: "transparent",
                color: "#e5e7eb",
                fontSize: "0.9rem",
                cursor: "pointer",
              }}
            >
              Add to wishlist (mock)
            </button>
          </div>
        </section>
      </div>

      {/* Similar products section */}
      <section style={{ marginTop: "32px" }}>
        <h2 style={{ fontSize: "1.1rem", marginBottom: "8px" }}>
          Similar products
        </h2>

        {similarError && (
          <p
            style={{
              color: "#fecaca",
              fontSize: "0.85rem",
              backgroundColor: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(248, 113, 113, 0.6)",
              padding: "8px 10px",
              borderRadius: "8px",
              maxWidth: "500px",
            }}
          >
            {similarError}
          </p>
        )}

        {similarLoading && (
          <p style={{ color: "#9ca3af", fontSize: "0.85rem" }}>
            Finding similar products...
          </p>
        )}

        {!similarLoading && !similarError && similarProducts.length === 0 && (
          <p style={{ color: "#9ca3af", fontSize: "0.85rem" }}>
            No similar products found yet. When more items are added in this
            category, they will appear here.
          </p>
        )}

        {!similarLoading && similarProducts.length > 0 && (
          <div
            style={{
              backgroundColor: "rgba(15,23,42,0.95)",
              borderRadius: "16px",
              border: "1px solid rgba(148,163,184,0.6)",
              padding: "12px",
              marginTop: "4px",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
                gap: "12px",
              }}
            >
              {similarProducts.map((p) => (
                <SimilarProductCard key={p._id} product={p} />
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
const handleAddToCart = async () => {
  try {
    await addToCart(product._id, 1);
    alert("Added to cart");
  } catch (err) { console.error(err); alert("Failed to add"); }
};
<button onClick={handleAddToCart}>Add to cart</button>
const SimilarProductCard = ({ product }) => {
  const price = Number(product.price) || 0;
  const placeholderInitial = product.title?.[0]?.toUpperCase() || "?";
  const imageUrl = product.imageUrl
    ? `http://localhost:5000${product.imageUrl}`
    : null;

  return (
    <Link
      to={`/product/${product._id}`}
      style={{ textDecoration: "none", color: "inherit" }}
    >
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
            height: "120px",
            background:
              "radial-gradient(circle at top left, #38bdf8, #4f46e5, #020617)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.title}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <span
              style={{
                fontSize: "1.8rem",
                fontWeight: 700,
                color: "#e5e7eb",
              }}
            >
              {placeholderInitial}
            </span>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <h3
            style={{
              fontSize: "0.9rem",
              margin: "4px 0 2px",
              overflow: "hidden",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
            }}
          >
            {product.title}
          </h3>
          <p
            style={{
              fontSize: "0.78rem",
              color: "#9ca3af",
              margin: 0,
              overflow: "hidden",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
            }}
          >
            {product.category}
          </p>
        </div>
        <div
          style={{
            marginTop: "6px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "0.8rem",
          }}
        >
          <span style={{ fontWeight: 600 }}>₹ {price.toLocaleString()}</span>
        </div>
      </div>
    </Link>
  );
};

export default ProductDetails;
