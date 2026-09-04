import Navbar from "./Navbar";
import Container from "./UI/Container";
import Footer from "./Footer";
import FlashMessage from "./FlashMessage";

export default function StoreLayout({ children, full = false }) {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <Navbar />
      <main className="flex-1">
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
