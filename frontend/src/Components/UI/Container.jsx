import cn from "../../lib/cn";

/**
 * The storefront's horizontal gutter and max width.
 *
 * This exact class string was previously copy-pasted at 13 call sites. Change
 * the page width here, once.
 */
export default function Container({
  as: Tag = "div",
  className = "",
  children,
  ...props
}) {
  return (
    <Tag
      className={cn(
        "mx-auto w-full max-w-screen-2xl px-4 md:px-8 lg:px-12",
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
