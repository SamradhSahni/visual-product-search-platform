// client/src/pages/Login.jsx
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PrimaryButton from "../components/common/PrimaryButton";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, authLoading, error, setError } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const from =
    location.state?.from?.pathname &&
    location.state.from.pathname !== "/login"
      ? location.state.from.pathname
      : "/";

  /* =========================
     Email / Password Login
  ========================= */
  const handleChange = (e) => {
    setError?.(null);
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      setError?.("Please enter your email and password.");
      return;
    }

    const result = await login({
      email: form.email,
      password: form.password,
    });

    if (result?.success) {
      navigate(from, { replace: true });
    }
  };

  /* =========================
     Google Login
  ========================= */
  const handleGoogleLogin = () => {
    // Redirect to backend Google OAuth route
    window.location.href = "http://localhost:5000/auth/google";
  };

  return (
    <div style={{ maxWidth: "420px", margin: "40px auto" }}>
      <h1 style={{ marginBottom: "4px" }}>Welcome back</h1>
      <p style={{ marginBottom: "16px", color: "#9ca3af", fontSize: "0.9rem" }}>
        Log in to continue shopping or manage your vendor dashboard.
      </p>

      {/* Error */}
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

      {/* =========================
          GOOGLE LOGIN
      ========================= */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        style={{
          width: "100%",
          padding: "10px",
          borderRadius: "999px",
          border: "1px solid rgba(148,163,184,0.8)",
          backgroundColor: "rgba(15,23,42,0.9)",
          color: "#e5e7eb",
          fontSize: "0.9rem",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          marginBottom: "12px",
        }}
      >
        <img
          src="https://developers.google.com/identity/images/g-logo.png"
          alt="Google"
          style={{ width: "18px", height: "18px" }}
        />
        Continue with Google
      </button>

      {/* Divider */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          margin: "10px 0",
          color: "#9ca3af",
          fontSize: "0.75rem",
        }}
      >
        <div style={{ flex: 1, height: "1px", background: "#334155" }} />
        OR
        <div style={{ flex: 1, height: "1px", background: "#334155" }} />
      </div>

      {/* =========================
          EMAIL / PASSWORD LOGIN
      ========================= */}
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
            placeholder="Your password"
            style={inputStyle}
          />
        </div>

        <PrimaryButton type="submit" style={{ width: "100%", marginTop: "8px" }}>
          {authLoading ? "Logging in..." : "Log in"}
        </PrimaryButton>

        <button
          type="button"
          onClick={() => navigate("/signup")}
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
          New here? Create an account
        </button>
      </form>
    </div>
  );
};

const inputStyle = {
  padding: "8px 10px",
  borderRadius: "8px",
  border: "1px solid rgba(148,163,184,0.8)",
  backgroundColor: "rgba(15,23,42,0.6)",
  color: "#e5e7eb",
  fontSize: "0.9rem",
  outline: "none",
};

export default Login;
