export default function Container({ as: Tag = "div", className = "", children }) {
  return (
    <Tag className={`mx-auto w-full max-w-screen-2xl px-4 md:px-8 lg:px-12 ${className}`}>
      {children}
    </Tag>
  );
}
