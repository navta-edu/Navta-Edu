export default function Footer() {
  return (
    
    <footer
      style={{
        width: "100%",
        padding: "20px 40px",
        boxSizing: "border-box",
        textAlign: "right",
        background: "#0b1220",
        color: "#94a3b8",
        borderTop: "1px solid #243047",
      }}
    >
      <div>
        <strong style={{ color: "#ffffff" }}>
          Developed by Hardik Sahu
        </strong>
      </div>

      <a
        href="https://www.linkedin.com/in/hardik-sahu-9797h1608p/"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: "#38bdf8",
          textDecoration: "none",
          marginTop: "6px",
          display: "inline-block",
        }}
      >
        LinkedIn
      </a>
    </footer>
  );
}
