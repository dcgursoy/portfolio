export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <main style={{ font: "16px/1.5 system-ui, sans-serif", maxWidth: "32rem", margin: "20vh auto 0", padding: "0 1.5rem" }}>
      <h1 style={{ fontSize: "1.25rem" }}>Page not found</h1>
      <p>There is no page at this address.</p>
      <p>
        {/* a plain link: the front page is a static file, not a Next.js route */}
        <a href="/">Back to the front page</a>
      </p>
    </main>
  );
}
