// client/src/pages/Home.jsx
import { useRef, useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import PrimaryButton from "../components/common/PrimaryButton";
import { searchByImage } from "../api/search";
import { getTrendingProducts } from "../api/products";
import { getPersonalizedRecommendations } from "../api/products";
import { useAuth } from "../context/AuthContext";


const Home = () => {
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // Image search state
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(null);
  const [imageResults, setImageResults] = useState([]); // { score, product }
  const [queryImagePreview, setQueryImagePreview] = useState(null);

  // Trending products state
  const [trending, setTrending] = useState([]);
  const [trendingError, setTrendingError] = useState(null);
  const { user } = useAuth();
  const [personal, setPersonal] = useState([]);
  const [personalError, setPersonalError] = useState(null);
  const [personalLoading, setPersonalLoading] = useState(false);


  // Load trending products once on mount
  useEffect(() => {
    const loadTrending = async () => {
      try {
        setTrendingError(null);
        const data = await getTrendingProducts(8);
        if (data.success) {
          setTrending(data.products || []);
        } else {
          setTrendingError(data.message || "Failed to load trending products");
        }
      } catch (err) {
        console.error("Trending error:", err.response || err.message);
        setTrendingError(
          err.response?.data?.message || "Failed to load trending products"
        );
      }
    };

    loadTrending();
  }, []);

  useEffect(() => {
  if (!user) {
    setPersonal([]);
    return;
  }
  const loadPersonal = async () => {
    try {
      setPersonalLoading(true);
      setPersonalError(null);
      const data = await getPersonalizedRecommendations(8);
      if (data.success) setPersonal(data.products || []);
      else setPersonalError(data.message || "Failed to fetch recommendations");
    } catch (err) {
      console.error("Personalized rec error:", err.response || err.message);
      setPersonalError("Failed to fetch recommendations");
    } finally {
      setPersonalLoading(false);
    }
  };
  loadPersonal();
}, [user]);

  // TEXT SEARCH → navigate to /browse?q=...
  const handleTextSearch = (e) => {
    e.preventDefault();
    const query = e.target.elements.searchQuery.value.trim();
    if (!query) return;
    navigate(`/browse?q=${encodeURIComponent(query)}`);
  };

  // When user clicks "Search by Image" button
  const handleImageButtonClick = () => {
    setImageError(null);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // When user selects an image file
  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setImageError("Please upload a valid image file (JPEG, PNG, etc.).");
      e.target.value = "";
      return;
    }

    // Show local preview of query image
    const previewUrl = URL.createObjectURL(file);
    setQueryImagePreview(previewUrl);

    try {
      setImageLoading(true);
      setImageError(null);
      setImageResults([]);

      const data = await searchByImage(file,12);

      if (data.success) {
        setImageResults(data.results.map((r) => ({ product: r.product, score: r.score })));
        if (!data.results || data.results.length === 0) {
          setImageError("No visually similar products found yet.");
        }
      } else {
        setImageError(data.message || "No similar items found");
        setImageResults([]);
      }
    } catch (err) {
      console.error("Image search error:", err.response || err.message);
      setImageError(
        err.response?.data?.message || "Image search failed. Please try again."
      );
    } finally {
      setImageLoading(false);
      // reset file input so selecting same file again works
      e.target.value = "";
    }
  };

  return (
    <div style={{ paddingTop: "32px", paddingBottom: "40px" }}>
      {/* Hero section */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1.1fr)",
          gap: "32px",
          alignItems: "center",
        }}
      >
        {/* Left: copy + search */}
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 10px",
              borderRadius: "999px",
              border: "1px solid rgba(148,163,184,0.6)",
              backgroundColor: "rgba(15,23,42,0.9)",
              fontSize: "0.75rem",
              marginBottom: "10px",
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "999px",
                background: "radial-gradient(circle, #22c55e, #166534)",
              }}
            />
            <span>Multi-vendor visual product search demo</span>
          </div>

          <h1 style={{ margin: 0, marginBottom: "10px", fontSize: "1.9rem" }}>
            Search products with{" "}
            <span style={{ color: "#38bdf8" }}>text</span> or{" "}
            <span style={{ color: "#a855f7" }}>images</span>.
          </h1>
          <p
            style={{
              marginTop: 0,
              marginBottom: "16px",
              color: "#9ca3af",
              fontSize: "0.95rem",
              maxWidth: "520px",
            }}
          >
            Upload a screenshot of something you like or type what you’re looking
            for. The system will find visually similar products from multiple
            vendors.
          </p>

          {/* Text search + image search buttons */}
          <form
            onSubmit={handleTextSearch}
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
              marginBottom: "10px",
            }}
          >
            <input
              name="searchQuery"
              type="text"
              placeholder="Try: white running sneakers"
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: "999px",
                border: "1px solid rgba(148,163,184,0.9)",
                backgroundColor: "rgba(15,23,42,0.9)",
                color: "#e5e7eb",
                fontSize: "0.9rem",
                outline: "none",
              }}
            />
            <PrimaryButton type="submit">Search</PrimaryButton>
          </form>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              type="button"
              onClick={handleImageButtonClick}
              style={{
                padding: "8px 14px",
                borderRadius: "999px",
                border: "1px dashed rgba(148,163,184,0.7)",
                background: "transparent",
                color: "#e5e7eb",
                fontSize: "0.85rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span role="img" aria-label="camera">
                📷
              </span>
              {imageLoading ? "Searching by image..." : "Search by image"}
            </button>

            <span style={{ fontSize: "0.78rem", color: "#9ca3af" }}>
              Upload a screenshot, clicked photo, or product image.
            </span>
          </div>

          {/* Hidden file input for image upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleImageChange}
          />

          {/* Link to browse page */}
          <p
            style={{
              marginTop: "16px",
              fontSize: "0.85rem",
              color: "#9ca3af",
            }}
          >
            Or{" "}
            <Link to="/browse" style={{ color: "#93c5fd" }}>
              browse all products
            </Link>{" "}
            from different vendors.
          </p>
        </div>

        {/* Right: visual teaser */}
        <div
          style={{
            borderRadius: "24px",
            border: "1px solid rgba(148,163,184,0.6)",
            background:
              "radial-gradient(circle at top left, #38bdf8, #6366f1, #020617)",
            minHeight: "230px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              backdropFilter: "blur(22px)",
              background:
                "radial-gradient(circle at 20% 0%, rgba(248,250,252,0.14), transparent 55%)",
            }}
          />
          <div
            style={{
              position: "relative",
              padding: "18px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div
              style={{
                fontSize: "0.8rem",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: "#e5e7eb",
                opacity: 0.85,
              }}
            >
              How it works
            </div>
            <div style={{ fontSize: "0.96rem", fontWeight: 600 }}>
              Upload an image → we compute embeddings → you get visually similar
              products instantly.
            </div>
            <ul
              style={{
                margin: 0,
                paddingLeft: "18px",
                fontSize: "0.82rem",
                color: "#e5e7eb",
              }}
            >
              <li>Multi-vendor product catalog</li>
              <li>Content-based recommendations</li>
              <li>ML-ready design (CLIP/ResNet integration later)</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Trending now */}
      <section style={{ marginTop: "26px" }}>
        <h2 style={{ fontSize: "1rem", marginBottom: "6px" }}>Trending now</h2>
        {trendingError && (
          <p
            style={{
              color: "#fecaca",
              fontSize: "0.85rem",
              backgroundColor: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(248, 113, 113, 0.6)",
              padding: "6px 8px",
              borderRadius: "8px",
              maxWidth: "500px",
            }}
          >
            {trendingError}
          </p>
        )}
        {!trendingError && trending.length === 0 && (
          <p style={{ color: "#9ca3af", fontSize: "0.85rem" }}>
            Trending products will appear here once your catalog starts receiving
            views.
          </p>
        )}
        {trending.length > 0 && (
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
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: "12px",
              }}
            >
              {trending.map((p) => (
                <TrendingCard key={p._id} product={p} />
              ))}
            </div>
          </div>
        )}
      </section>
      {user && (
  <section style={{ marginTop: "18px" }}>
    <h2>Recommended for you</h2>
    {personalLoading && <p>Loading recommendations...</p>}
    {personalError && <p style={{ color: "red" }}>{personalError}</p>}
    {!personalLoading && personal.length === 0 && (
      <p style={{ color: "#9ca3af" }}>No recommendations yet — view products to get personalized suggestions.</p>
    )}
    {personal.length > 0 && (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px,1fr))", gap: "12px" }}>
        {personal.map((p) => <TrendingCard key={p._id} product={p} />)}
      </div>
    )}
  </section>
)}
  
      {/* Divider */}
      <div
        style={{
          marginTop: "28px",
          marginBottom: "8px",
          borderTop: "1px solid rgba(30,64,175,0.7)",
          opacity: 0.9,
        }}
      />

      {/* Image search results */}
      <section style={{ marginTop: "14px" }}>
        <h2 style={{ fontSize: "1rem", marginBottom: "8px" }}>
          Visual matches (image search)
        </h2>
        {imageError && (
          <div
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(248, 113, 113, 0.6)",
              color: "#fecaca",
              padding: "8px 10px",
              borderRadius: "8px",
              marginBottom: "10px",
              fontSize: "0.85rem",
            }}
          >
            {imageError}
          </div>
        )}

        {/* Query image + results */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: queryImagePreview
              ? "minmax(0, 0.9fr) minmax(0, 2.1fr)"
              : "minmax(0, 1fr)",
            gap: "14px",
            alignItems: "flex-start",
          }}
        >
          {/* Left: query image preview */}
          {queryImagePreview && (
            <div
              style={{
                backgroundColor: "rgba(15,23,42,0.95)",
                borderRadius: "16px",
                border: "1px solid rgba(148,163,184,0.6)",
                padding: "10px",
              }}
            >
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "#9ca3af",
                  marginTop: 0,
                  marginBottom: "8px",
                }}
              >
                Your uploaded image
              </p>
              <img
                src={queryImagePreview}
                alt="Query"
                style={{
                  width: "100%",
                  maxHeight: "260px",
                  objectFit: "cover",
                  borderRadius: "12px",
                  border: "1px solid rgba(148,163,184,0.8)",
                }}
              />
            </div>
          )}

          {/* Right: results */}
          <div>
            {!imageLoading && imageResults.length === 0 && !imageError && (
              <p style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
                Upload an image to see visually similar products here.
              </p>
            )}

            {imageLoading && (
              <p style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
                Analyzing image and searching for similar products...
              </p>
            )}

            {!imageLoading && imageResults.length > 0 && (
              <div
                style={{
                  backgroundColor: "rgba(15,23,42,0.95)",
                  borderRadius: "16px",
                  border: "1px solid rgba(148,163,184,0.6)",
                  padding: "12px",
                }}
              >
                <p
                  style={{
                    fontSize: "0.8rem",
                    color: "#9ca3af",
                    marginTop: 0,
                    marginBottom: "10px",
                  }}
                >
                  Top matches based on image similarity (prototype scoring).
                </p>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
                    gap: "12px",
                  }}
                >
                  {imageResults.map((item, index) => (
                    <ImageResultCard key={item.product._id + index} item={item} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

const ImageResultCard = ({ item }) => {
  const product = item.product;
  const score = item.score ?? 0;
  const price = Number(product.price) || 0;
  const placeholderInitial = product.title?.[0]?.toUpperCase() || "?";
  const imageUrl = product.imageUrl
    ? `http://localhost:5000${product.imageUrl}`
    : null;

  return (
    <Link
      to={`/product/${product._id}`}
      style={{
        textDecoration: "none",
        color: "inherit",
      }}
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
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
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
          <span style={{ color: "#9ca3af" }}>
            {(score * 100).toFixed(0)}% match
          </span>
        </div>
      </div>
    </Link>
  );
};

const TrendingCard = ({ product }) => {
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
            height: "110px",
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
                fontSize: "1.6rem",
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
          <span style={{ color: "#9ca3af", fontSize: "0.75rem" }}>
            {product.vendor?.name || "Vendor"}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default Home;
