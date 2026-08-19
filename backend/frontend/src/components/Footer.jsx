const Footer = () => {
  return (
    <footer
      style={{
        position: "relative",
        width: "100%",
        padding: "30px 40px",
        background: "#0f172a",
        borderTop: "1px solid rgba(255,255,255,0.1)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxSizing: "border-box",
      }}
    >
      {/* Copyright - Left */}
      <div
        style={{
          fontSize: "13px",
          color: "#94a3b8",
        }}
      >
        © 2026 Navta. All rights reserved.
      </div>

      {/* Developer Credit - Right */}
      <div
        style={{
          textAlign: "right",
          fontSize: "13px",
        }}
      >
        <div style={{ marginBottom: "4px" }}>
          Developed by <strong>Hardik Sahu</strong>
        </div>

        <a
          href="https://www.linkedin.com/in/hardik-sahu-9797h1608p/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "#0A66C2",
            textDecoration: "none",
            fontWeight: "600",
          }}
        >
          LinkedIn ↗
        </a>
      </div>
    </footer>
  );
};

export default Footer;
