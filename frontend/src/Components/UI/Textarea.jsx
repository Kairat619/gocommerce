import cn from "../../lib/cn";
import { controlBase, controlSizes } from "./controlStyles";

/** A multi-line input styled to match Input. */
export default function Textarea({ size = "md", className = "", ...props }) {
  return (
    <textarea
      className={cn(controlBase, controlSizes[size] || controlSizes.md, className)}
      {...props}
    />
  );
}
