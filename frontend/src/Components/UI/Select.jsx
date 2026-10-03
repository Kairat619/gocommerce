import cn from "../../lib/cn";
import { controlSizes, useControlLook } from "./controlStyles";

/** A native select styled to match Input. */
export default function Select({ size = "md", className = "", children, ...props }) {
  const look = useControlLook();

  return (
    <select
      className={cn(look.control, controlSizes[size] || controlSizes.md, className)}
      {...props}
    >
      {children}
    </select>
  );
}
