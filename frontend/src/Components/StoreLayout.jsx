import Navbar from "./Navbar";
import Container from "./UI/Container";
import Footer from "./Footer";
import FlashMessage from "./FlashMessage";

export default function StoreLayout({ children, full = false }) {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:bg-ink focus:px-4 focus:py-2 focus:text-label-lg focus:font-semibold focus:uppercase focus:tracking-[0.08em] focus:text-white"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main-content" className="flex-1">
        {full ? (
          children
        ) : (
          <Container className="py-10 md:py-14">{children}</Container>
        )}
      </main>
      <Footer />
      <FlashMessage />
    </div>
  );
}
