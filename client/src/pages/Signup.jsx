// client/src/pages/Signup.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PrimaryButton from "../components/common/PrimaryButton";

const Signup = () => {
  const navigate = useNavigate();
  const { signup, authLoading, error, setError } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "customer",
  });

  const handleChange = (e) => {
    setError?.(null);
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { name, email, password, role } = form;

    if (!name || !email || !password) {
      setError?.("Please fill in all required fields.");
      return;
    }

    const result = await signup({ name, email, password, role });

    if (result.success) {
      // After successful signup, redirect (e.g., to home or dashboard)
      navigate("/");
    }
  };

  return (
    <div style={{ maxWidth: "420px", margin: "40px auto" }}>
      <h1 style={{ marginBottom: "4px" }}>Create your account</h1>
      <p style={{ marginBottom: "16px", color: "#9ca3af", fontSize: "0.9rem" }}>
        Join Visual Shop as a customer or a vendor.
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

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          backgroundColor: "rgba(15,23,42,0.95)",
          borderRadius: "16px",
          padding: "18px 16px",
          border: "1px solid rgba(148, 163, 184, 0.6)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "0.85rem" }}>Name</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Your full name"
            style={inputStyle}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "0.85rem" }}>Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            style={inputStyle}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "0.85rem" }}>Password</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="At least 6 characters"
            style={inputStyle}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "0.85rem" }}>Role</label>
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            style={{
              ...inputStyle,
              backgroundColor: "rgba(15,23,42,1)",
            }}
          >
            <option value="customer">Customer</option>
            <option value="vendor">Vendor</option>
          </select>
        </div>

        <PrimaryButton type="submit" style={{ width: "100%", marginTop: "8px" }}>
          {authLoading ? "Creating account..." : "Sign up"}
        </PrimaryButton>

        <button
          type="button"
          onClick={() => navigate("/login")}
          style={{
            marginTop: "4px",
            background: "transparent",
            border: "none",
            color: "#93c5fd",
            cursor: "pointer",
            fontSize: "0.85rem",
            textAlign: "left",
          }}
        >
          Already have an account? Log in
        </button>
      </form>
    </div>
  );
};

// shared style for inputs
const inputStyle = {
  padding: "8px 10px",
  borderRadius: "8px",
  border: "1px solid rgba(148,163,184,0.8)",
  backgroundColor: "rgba(15,23,42,0.6)",
  color: "#e5e7eb",
  fontSize: "0.9rem",
  outline: "none",
};

export default Signup;
