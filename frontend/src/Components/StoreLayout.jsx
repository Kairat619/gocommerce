import Navbar from "./Navbar";
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
          <div className="mx-auto w-full max-w-screen-2xl px-4 py-10 md:px-8 md:py-14 lg:px-12">
            {children}
          </div>
        )}
      </main>
      <Footer />
      <FlashMessage />
    </div>
  );
}
