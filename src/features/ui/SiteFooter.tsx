/** Copyright line shown at the bottom of every page except the full-screen chat. */
export function SiteFooter({ className = "" }: { className?: string }) {
  return (
    <footer className={`text-center text-xs tracking-wide text-subtle ${className}`}>
      <p>&copy; 2026 GWANG. All rights reserved.</p>
    </footer>
  );
}
