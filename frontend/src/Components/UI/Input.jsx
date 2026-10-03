import cn from "../../lib/cn";
import { controlSizes, useControlLook } from "./controlStyles";

/** A text or number input in the storefront's visual language. */
export default function Input({ size = "md", className = "", ...props }) {
  const look = useControlLook();

  return (
    <input
      className={cn(look.control, controlSizes[size] || controlSizes.md, className)}
      {...props}
    />
  );
}
