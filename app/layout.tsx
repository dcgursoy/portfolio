// The site itself is the static pages in public/. Next.js needs a root layout to build; the only
// page that uses it is the "not found" page.
import type { ReactNode } from "react";

export const metadata = { title: "Deniz Gursoy" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
