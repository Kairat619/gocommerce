import cn from "../../lib/cn";
import { controlBase, controlSizes } from "./controlStyles";

/** A native select styled to match Input. */
export default function Select({ size = "md", className = "", children, ...props }) {
  return (
    <select
      className={cn(controlBase, controlSizes[size] || controlSizes.md, className)}
      {...props}
    >
      {children}
    </select>
  );
}
