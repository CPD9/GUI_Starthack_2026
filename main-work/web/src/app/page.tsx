const sectionStyle = {
  border: "1px solid #1f2a44",
  borderRadius: 14,
  padding: 20,
  background: "#0d1526",
};

export default function HomePage() {
  return (
    <main
      style={{
        maxWidth: 980,
        margin: "0 auto",
        padding: "48px 20px 64px",
        display: "grid",
        gap: 18,
      }}
    >
      <header style={sectionStyle}>
        <h1 style={{ margin: 0, fontSize: 34 }}>StartHack 2026</h1>
        <p style={{ marginTop: 12, marginBottom: 0, color: "#b5c0da" }}>
          AI analytics assistant for material testing data.
        </p>
      </header>

      <section style={sectionStyle}>
        <h2 style={{ marginTop: 0 }}>Current stack</h2>
        <ul style={{ marginBottom: 0, lineHeight: 1.7 }}>
          <li>Next.js 15 + React</li>
          <li>Better Auth + Polar</li>
          <li>Neon + Drizzle ORM</li>
          <li>Inngest</li>
          <li>Stream</li>
        </ul>
      </section>

      <section style={sectionStyle}>
        <h2 style={{ marginTop: 0 }}>Next implementation step</h2>
        <p style={{ marginBottom: 0, color: "#b5c0da" }}>
          Build auth screens and wire session-aware routes in a dedicated feature
          branch before merging into <code>develop</code>.
        </p>
      </section>
    </main>
  );
}
