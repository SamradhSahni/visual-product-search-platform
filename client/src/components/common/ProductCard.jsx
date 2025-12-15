import { Link } from "react-router-dom";

const ProductCard = ({ product }) => {
  if (!product) return null;

  const {
    _id,
    title,
    price,
    category,
    vendor,
    imageUrl,
    _similarityScore,
  } = product;

  const finalImageUrl = imageUrl
    ? `http://localhost:5000${imageUrl}`
    : null;

  return (
    <Link
      to={`/product/${_id}`}
      style={{
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div
        style={{
          borderRadius: "14px",
          border: "1px solid rgba(148,163,184,0.5)",
          backgroundColor: "rgba(15,23,42,0.9)",
          padding: "10px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          height: "100%",
          transition: "transform 0.15s ease, box-shadow 0.15s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow =
            "0 10px 20px rgba(0,0,0,0.35)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "none";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        {/* Image */}
        <div
          style={{
            borderRadius: "10px",
            height: "150px",
            overflow: "hidden",
            backgroundColor: "#020617",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {finalImageUrl ? (
            <img
              src={finalImageUrl}
              alt={title}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : (
            <span
              style={{
                color: "#94a3b8",
                fontSize: "0.9rem",
              }}
            >
              No image
            </span>
          )}
        </div>

        {/* Title */}
        <h3
          style={{
            fontSize: "0.95rem",
            fontWeight: 600,
            margin: "4px 0 0",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {title}
        </h3>

        {/* Category */}
        {category && (
          <p
            style={{
              fontSize: "0.75rem",
              color: "#9ca3af",
              margin: 0,
            }}
          >
            {category}
          </p>
        )}

        {/* Price + Vendor */}
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "0.85rem",
          }}
        >
          <span style={{ fontWeight: 700 }}>
            ₹ {Number(price || 0).toLocaleString()}
          </span>

          {vendor?.name && (
            <span
              style={{
                fontSize: "0.7rem",
                color: "#94a3b8",
              }}
            >
              {vendor.name}
            </span>
          )}
        </div>

        {/* Similarity score (only for image search / recommendations) */}
        {typeof _similarityScore === "number" && (
          <div
            style={{
              marginTop: "4px",
              fontSize: "0.7rem",
              color: "#38bdf8",
              fontWeight: 600,
              textAlign: "right",
            }}
          >
            {Math.round(_similarityScore * 100)}% similar
          </div>
        )}
      </div>
    </Link>
  );
};

export default ProductCard;
