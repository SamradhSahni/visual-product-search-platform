// client/src/pages/VendorDashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PrimaryButton from "../components/common/PrimaryButton";
import {
  getMyProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../api/products";

const VendorDashboard = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const [products, setProducts] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    tags: "",
    stock: "",
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null); // URL or existing image

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/login", { state: { from: { pathname: "/vendor/dashboard" } } });
      } else if (user.role !== "vendor" && user.role !== "admin") {
        setError("Only vendors and admins can access the vendor dashboard.");
      }
    }
  }, [user, loading, navigate]);

  const loadProducts = async () => {
    try {
      setFetching(true);
      setError(null);
      const data = await getMyProducts();
      if (data.success) {
        setProducts(data.products || []);
      } else {
        setError(data.message || "Failed to fetch products");
      }
    } catch (err) {
      console.error("Failed to load products:", err.response || err.message);
      setError(
        err.response?.data?.message || "Failed to load products. Please try again."
      );
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (user && (user.role === "vendor" || user.role === "admin")) {
      loadProducts();
    }
  }, [user]);

  const handleChange = (e) => {
    setError(null);
    setSuccessMsg(null);
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    setError(null);
    setSuccessMsg(null);
    const file = e.target.files?.[0];
    if (!file) {
      setImageFile(null);
      setImagePreview(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (JPEG, PNG, etc.).");
      setImageFile(null);
      setImagePreview(null);
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({
      title: "",
      description: "",
      price: "",
      category: "",
      tags: "",
      stock: "",
    });
    setImageFile(null);
    setImagePreview(null);
  };

  const handleEditClick = (product) => {
    setEditingId(product._id);
    setForm({
      title: product.title || "",
      description: product.description || "",
      price: product.price?.toString() || "",
      category: product.category || "",
      tags: product.tags?.join(", ") || "",
      stock: product.stock?.toString() || "",
    });
    setImageFile(null);
    setImagePreview(product.imageUrl ? `http://localhost:5000${product.imageUrl}` : null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteClick = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to completely delete this product?"
    );
    if (!confirmDelete) return;

    try {
      setSaving(true);
      setError(null);
      setSuccessMsg(null);
      const data = await deleteProduct(id);
      if (data.success) {
        setSuccessMsg("Product deleted successfully.");
        await loadProducts();
        if (editingId === id) resetForm();
      } else {
        setError(data.message || "Failed to delete product.");
      }
    } catch (err) {
      console.error("Delete product error:", err.response || err.message);
      setError(
        err.response?.data?.message || "Failed to delete product. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!form.title || !form.description || !form.price || !form.category) {
      setError("Title, description, price, and category are required.");
      return;
    }

    const payload = {
      title: form.title,
      description: form.description,
      price: Number(form.price),
      category: form.category,
      tags: form.tags
        ? form.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [],
      stock: form.stock ? Number(form.stock) : 0,
      // isActive is optional here – by default products are active
    };

    try {
      setSaving(true);

      if (editingId) {
        const data = await updateProduct(editingId, payload, imageFile);
        if (data.success) {
          setSuccessMsg("Product updated successfully.");
        } else {
          setError(data.message || "Failed to update product.");
        }
      } else {
        const data = await createProduct(payload, imageFile);
        if (data.success) {
          setSuccessMsg("Product created successfully.");
        } else {
          setError(data.message || "Failed to create product.");
        }
      }

      await loadProducts();
      resetForm();
    } catch (err) {
      console.error("Save product error:", err.response || err.message);
      setError(
        err.response?.data?.message || "Failed to save product. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ paddingTop: "40px", textAlign: "center" }}>
        Loading user...
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ paddingTop: "40px", textAlign: "center" }}>
        Redirecting to login...
      </div>
    );
  }

  if (user.role !== "vendor" && user.role !== "admin") {
    return (
      <div style={{ paddingTop: "40px", maxWidth: "600px", margin: "0 auto" }}>
        <h1>Vendor Dashboard</h1>
        <p style={{ marginTop: "12px", color: "#fca5a5" }}>
          Only vendors and admins can access this area.
        </p>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: "24px", paddingBottom: "40px" }}>
      <h1 style={{ marginBottom: "4px" }}>Vendor Dashboard</h1>
      <p style={{ marginBottom: "16px", color: "#9ca3af", fontSize: "0.9rem" }}>
        Manage your products, stock, pricing and main image. Embeddings will be used
        for visual search and recommendations.
      </p>

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

      {successMsg && (
        <div
          style={{
            backgroundColor: "rgba(22, 163, 74, 0.12)",
            border: "1px solid rgba(34, 197, 94, 0.6)",
            color: "#bbf7d0",
            padding: "8px 10px",
            borderRadius: "8px",
            marginBottom: "12px",
            fontSize: "0.85rem",
          }}
        >
          {successMsg}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1fr)",
          gap: "24px",
        }}
      >
        {/* Left: product list */}
        <section>
          <div
            style={{
              marginBottom: "10px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h2 style={{ fontSize: "1.1rem" }}>My products</h2>
            <button
              type="button"
              onClick={loadProducts}
              disabled={fetching}
              style={{
                fontSize: "0.85rem",
                borderRadius: "999px",
                padding: "5px 12px",
                border: "1px solid rgba(148, 163, 184, 0.7)",
                background: "transparent",
                color: "#e5e7eb",
                cursor: "pointer",
              }}
            >
              {fetching ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          <div
            style={{
              backgroundColor: "rgba(15,23,42,0.95)",
              borderRadius: "16px",
              border: "1px solid rgba(148, 163, 184, 0.6)",
              padding: "10px",
              maxHeight: "430px",
              overflow: "auto",
            }}
          >
            {products.length === 0 ? (
              <p style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
                You have not added any products yet. Use the form on the right to add
                your first product.
              </p>
            ) : (
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "0.85rem",
                }}
              >
                <thead>
                  <tr
                    style={{
                      textAlign: "left",
                      borderBottom: "1px solid rgba(55, 65, 81, 0.9)",
                    }}
                  >
                    <th style={{ padding: "6px" }}>Image</th>
                    <th style={{ padding: "6px" }}>Title</th>
                    <th style={{ padding: "6px" }}>Category</th>
                    <th style={{ padding: "6px" }}>Price</th>
                    <th style={{ padding: "6px" }}>Stock</th>
                    <th style={{ padding: "6px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr
                      key={p._id}
                      style={{
                        borderBottom: "1px solid rgba(31, 41, 55, 0.85)",
                      }}
                    >
                      <td style={{ padding: "6px" }}>
                        {p.imageUrl ? (
                          <img
                            src={`http://localhost:5000${p.imageUrl}`}
                            alt={p.title}
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "8px",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "8px",
                              background:
                                "radial-gradient(circle at top left, #38bdf8, #4f46e5, #020617)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "0.8rem",
                            }}
                          >
                            ?
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "6px" }}>{p.title}</td>
                      <td style={{ padding: "6px" }}>{p.category}</td>
                      <td style={{ padding: "6px" }}>
                        ₹ {Number(p.price).toLocaleString()}
                      </td>
                      <td style={{ padding: "6px" }}>{p.stock}</td>
                      <td style={{ padding: "6px" }}>
                        <button
                          type="button"
                          onClick={() => handleEditClick(p)}
                          style={smallButtonStyle}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(p._id)}
                          style={{
                            ...smallButtonStyle,
                            borderColor: "rgba(248,113,113,0.6)",
                            color: "#fecaca",
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Right: create/edit form */}
        <section>
          <h2 style={{ fontSize: "1.1rem", marginBottom: "8px" }}>
            {editingId ? "Edit product" : "Add new product"}
          </h2>
          <form
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              backgroundColor: "rgba(15,23,42,0.95)",
              borderRadius: "16px",
              padding: "16px",
              border: "1px solid rgba(148, 163, 184, 0.6)",
            }}
          >
            <FormField label="Title">
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                style={inputStyle}
                placeholder="Product title"
              />
            </FormField>

            <FormField label="Description">
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                style={{ ...inputStyle, minHeight: "70px", resize: "vertical" }}
                placeholder="Short description of the product"
              />
            </FormField>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
              }}
            >
              <FormField label="Price (₹)">
                <input
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="2999"
                />
              </FormField>
              <FormField label="Stock">
                <input
                  type="number"
                  name="stock"
                  value={form.stock}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="0"
                />
              </FormField>
            </div>

            <FormField label="Category">
              <input
                type="text"
                name="category"
                value={form.category}
                onChange={handleChange}
                style={inputStyle}
                placeholder="Shoes, Dresses, Electronics..."
              />
            </FormField>

            <FormField label="Tags (comma separated)">
              <input
                type="text"
                name="tags"
                value={form.tags}
                onChange={handleChange}
                style={inputStyle}
                placeholder="running, white, sneakers"
              />
            </FormField>

            <FormField label="Main image (optional)">
              <input type="file" accept="image/*" onChange={handleImageChange} />
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{
                    marginTop: "6px",
                    width: "100px",
                    height: "100px",
                    borderRadius: "10px",
                    objectFit: "cover",
                    border: "1px solid rgba(148,163,184,0.8)",
                  }}
                />
              )}
            </FormField>

            <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
              <PrimaryButton type="submit" style={{ flex: 1 }}>
                {saving
                  ? editingId
                    ? "Saving..."
                    : "Creating..."
                  : editingId
                  ? "Save changes"
                  : "Create product"}
              </PrimaryButton>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "999px",
                    border: "1px solid rgba(148,163,184,0.8)",
                    background: "transparent",
                    color: "#e5e7eb",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    whiteSpace: "nowrap",
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};

const FormField = ({ label, children }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
    <label style={{ fontSize: "0.85rem" }}>{label}</label>
    {children}
  </div>
);

const inputStyle = {
  padding: "8px 10px",
  borderRadius: "8px",
  border: "1px solid rgba(148,163,184,0.8)",
  backgroundColor: "rgba(15,23,42,0.6)",
  color: "#e5e7eb",
  fontSize: "0.9rem",
  outline: "none",
};

const smallButtonStyle = {
  marginRight: "6px",
  padding: "4px 10px",
  borderRadius: "999px",
  border: "1px solid rgba(148,163,184,0.8)",
  background: "transparent",
  color: "#e5e7eb",
  fontSize: "0.8rem",
  cursor: "pointer",
};

export default VendorDashboard;
