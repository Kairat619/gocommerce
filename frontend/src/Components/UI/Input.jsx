import cn from "../../lib/cn";
import { controlBase, controlSizes } from "./controlStyles";

/** A text or number input in the storefront's visual language. */
export default function Input({ size = "md", className = "", ...props }) {
  return (
    <input
      className={cn(controlBase, controlSizes[size] || controlSizes.md, className)}
      {...props}
    />
  );
}
