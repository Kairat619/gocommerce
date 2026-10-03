import cn from "../../lib/cn";
import { controlSizes, useControlLook } from "./controlStyles";

/** A multi-line input styled to match Input. */
export default function Textarea({ size = "md", className = "", ...props }) {
  const look = useControlLook();

  return (
    <textarea
      className={cn(look.control, controlSizes[size] || controlSizes.md, className)}
      {...props}
    />
  );
}
