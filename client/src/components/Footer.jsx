const Footer = () => {
  return (
    <footer style={{
      background: "#222",
      color: "#fff",
      padding: "10px",
      textAlign: "center",
    }}>
      <p>© {new Date().getFullYear()} Visual Shop – All Rights Reserved.</p>
    </footer>
  );
};

export default Footer;
