// client/src/components/layout/Navbar.jsx
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout, authLoading } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const isVendor = user && (user.role === "vendor" || user.role === "admin");

  return (
    <nav
      style={{
        background: "#050816",
        color: "#fff",
        padding: "12px 32px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Logo / Brand */}
      <div
        style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}
        onClick={() => navigate("/")}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "999px",
            background:
              "radial-gradient(circle at 30% 30%, #38bdf8, #1d4ed8 55%, #020617 100%)",
          }}
        />
        <div>
          <div style={{ fontWeight: 700, letterSpacing: "0.04em" }}>
            Visual Shop
          </div>
          <div style={{ fontSize: "0.75rem", opacity: 0.7 }}>
            Search by text or image
          </div>
        </div>
      </div>

      {/* Nav Links */}
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        <Link
          to="/"
          style={{ color: "#e5e7eb", textDecoration: "none", fontSize: "0.9rem" }}
        >
          Home
        </Link>
        <Link
          to="/browse"
          style={{ color: "#e5e7eb", textDecoration: "none", fontSize: "0.9rem" }}
        >
          Browse
        </Link>

        {/* If vendor/admin, show Vendor Dashboard link */}
        {isVendor && (
          <Link
            to="/vendor/dashboard"
            style={{ color: "#e5e7eb", textDecoration: "none", fontSize: "0.9rem" }}
          >
            Vendor Dashboard
          </Link>
        )}

        {!user ? (
          <>
            <Link
              to="/login"
              style={{
                color: "#e5e7eb",
                textDecoration: "none",
                fontSize: "0.9rem",
                padding: "6px 14px",
                borderRadius: "999px",
                border: "1px solid rgba(148,163,184,0.6)",
              }}
            >
              Login
            </Link>
            <Link
              to="/signup"
              style={{
                color: "#0b1120",
                textDecoration: "none",
                fontSize: "0.9rem",
                padding: "6px 16px",
                borderRadius: "999px",
                background: "linear-gradient(135deg, #38bdf8, #4f46e5)",
                fontWeight: 600,
              }}
            >
              Get Started
            </Link>
          </>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "0.85rem", color: "#cbd5f5" }}>
              {user.role === "vendor"
                ? "Vendor"
                : user.role === "admin"
                ? "Admin"
                : "Hi"}
              , <strong>{user.name?.split(" ")[0] || "User"}</strong>
            </span>
            <button
              onClick={handleLogout}
              disabled={authLoading}
              style={{
                padding: "6px 14px",
                borderRadius: "999px",
                border: "1px solid rgba(148,163,184,0.6)",
                background: "transparent",
                color: "#e5e7eb",
                cursor: "pointer",
                fontSize: "0.85rem",
              }}
            >
              {authLoading ? "Logging out..." : "Logout"}
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
