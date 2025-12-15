// client/src/pages/Home.jsx
import { useRef, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import ProductCard from "../components/common/ProductCard";
import PrimaryButton from "../components/common/PrimaryButton";
import { searchByImage } from "../api/search";
import { getTrendingProducts, getPersonalizedRecommendations } from "../api/products";
import { useAuth } from "../context/AuthContext";

const Home = () => {
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  /* ===================== STATE ===================== */
  const [isImageSearch, setIsImageSearch] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(null);
  const [imageResults, setImageResults] = useState([]);
  const [queryImagePreview, setQueryImagePreview] = useState(null);

  const [trending, setTrending] = useState([]);
  const [trendingError, setTrendingError] = useState(null);

  const [personal, setPersonal] = useState([]);
  const [personalLoading, setPersonalLoading] = useState(false);
  const [personalError, setPersonalError] = useState(null);

  /* ===================== TRENDING ===================== */
  useEffect(() => {
    (async () => {
      try {
        const res = await getTrendingProducts(8);
        if (res.success) setTrending(res.products || []);
        else setTrendingError(res.message);
      } catch {
        setTrendingError("Failed to load trending products");
      }
    })();
  }, []);

  /* ===================== PERSONALIZED ===================== */
  useEffect(() => {
    if (!user) return setPersonal([]);

    (async () => {
      try {
        setPersonalLoading(true);
        const res = await getPersonalizedRecommendations(8);
        if (res.success) setPersonal(res.products || []);
        else setPersonalError(res.message);
      } catch {
        setPersonalError("Failed to load recommendations");
      } finally {
        setPersonalLoading(false);
      }
    })();
  }, [user]);

  /* ===================== TEXT SEARCH ===================== */
  const handleTextSearch = (e) => {
    e.preventDefault();
    const q = e.target.searchQuery.value.trim();
    if (!q) return;
    setIsImageSearch(false);
    navigate(`/browse?q=${encodeURIComponent(q)}`);
  };

  /* ===================== IMAGE SEARCH ===================== */
  const handleImageButtonClick = () => {
    setImageError(null);
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  setIsImageSearch(true);
  setImageLoading(true);
  setImageError(null);
  setImageResults([]);

  setQueryImagePreview(URL.createObjectURL(file));

  try {
    const res = await searchByImage(file, 12);

    console.log("IMAGE SEARCH RAW RESPONSE:", res.data);

    if (!res.data?.success) {
      setImageError("Image search failed");
      return;
    }

    // 🔥 NORMALIZATION (THIS IS THE FIX)
    let products = [];

    if (Array.isArray(res.data.products)) {
      products = res.data.products;
    } else if (Array.isArray(res.data.results)) {
      products = res.data.results
        .map(r => r.product)
        .filter(Boolean);
    }

    console.log("NORMALIZED PRODUCTS:", products);

    if (products.length === 0) {
      setImageError("No similar items found");
    }

    setImageResults(products);

  } catch (err) {
    console.error("Image search error:", err);
    setImageError("Image search failed");
  } finally {
    setImageLoading(false);
    e.target.value = "";
  }
};


  /* ===================== RENDER ===================== */
  return (
    <div style={{ paddingTop: 32, paddingBottom: 40 }}>
      {/* ================= HERO ================= */}
      <section style={{ display: "grid", gridTemplateColumns: "1.4fr 1.1fr", gap: 32 }}>
        <div>
          <h1>Search products with <span style={{ color: "#38bdf8" }}>text</span> or <span style={{ color: "#a855f7" }}>images</span></h1>

          <form onSubmit={handleTextSearch} style={{ display: "flex", gap: 8 }}>
            <input
              name="searchQuery"
              placeholder="Try: black sneakers"
              style={{ flex: 1, padding: 10 }}
            />
            <PrimaryButton type="submit">Search</PrimaryButton>
          </form>

          <button onClick={handleImageButtonClick} style={{ marginTop: 10 }}>
            📷 Search by image
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleImageChange}
          />
        </div>
      </section>

      {/* ================= IMAGE RESULTS ================= */}
      <section style={{ marginTop: 24 }}>
        <h2>Visual matches</h2>

        {imageLoading && <p>Searching by image…</p>}
        {imageError && <p style={{ color: "red" }}>{imageError}</p>}

        {isImageSearch && imageResults.length > 0 && (
          <div className="grid">
            {imageResults.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}

        {isImageSearch && !imageLoading && imageResults.length === 0 && !imageError && (
          <p>No similar items found</p>
        )}
      </section>

      {/* ================= TRENDING ================= */}
      <section style={{ marginTop: 32 }}>
        <h2>Trending</h2>
        {trendingError && <p>{trendingError}</p>}
        <div className="grid">
          {trending.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      </section>

      {/* ================= PERSONAL ================= */}
      {user && (
        <section style={{ marginTop: 32 }}>
          <h2>Recommended for you</h2>
          {personalLoading && <p>Loading…</p>}
          {personalError && <p>{personalError}</p>}
          <div className="grid">
            {personal.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
