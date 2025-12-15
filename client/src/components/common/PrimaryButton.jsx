// client/src/components/common/PrimaryButton.jsx
const PrimaryButton = ({ children, onClick, type = "button", style = {} }) => {
  return (
    <button
      type={type}
      onClick={onClick}
      style={{
        padding: "10px 18px",
        borderRadius: "999px",
        border: "none",
        cursor: "pointer",
        fontWeight: 600,
        fontSize: "0.95rem",
        background:
          "linear-gradient(135deg, #2563eb, #7c3aed)", // blue to purple
        color: "#fff",
        boxShadow: "0 8px 20px rgba(37, 99, 235, 0.35)",
        transition: "transform 0.1s ease, box-shadow 0.1s ease",
        ...style,
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = "scale(0.97)";
        e.currentTarget.style.boxShadow = "0 4px 10px rgba(37, 99, 235, 0.35)";
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow =
          "0 8px 20px rgba(37, 99, 235, 0.35)";
      }}
    >
      {children}
    </button>
  );
};

export default PrimaryButton;
