import { useEffect } from "react";
import { router } from "@inertiajs/react";

/**
 * Closing rules shared by the storefront headers' menus.
 *
 * A dropdown that only closes when you click its own trigger is a trap: click
 * anywhere else and it follows you down the page. Escape closes whichever menu
 * is open, and navigating away must not leave one hanging open behind the new
 * page.
 *
 * @param {Object} options
 * @param {boolean} options.dropdownOpen
 * @param {boolean} options.drawerOpen
 * @param {import('react').RefObject<HTMLElement>} options.dropdownRef
 * @param {() => void} options.closeAll
 */
export default function useMenuDismiss({
  dropdownOpen,
  drawerOpen,
  dropdownRef,
  closeAll,
}) {
  useEffect(() => {
    if (!dropdownOpen) return undefined;

    const onPointerDown = (e) => {
      if (!dropdownRef.current?.contains(e.target)) closeAll();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [dropdownOpen, dropdownRef, closeAll]);

  useEffect(() => {
    if (!dropdownOpen && !drawerOpen) return undefined;

    const onKeyDown = (e) => {
      if (e.key === "Escape") closeAll();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dropdownOpen, drawerOpen, closeAll]);

  useEffect(() => router.on("navigate", closeAll), [closeAll]);
}
