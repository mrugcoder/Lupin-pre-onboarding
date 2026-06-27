/**
 * Public layout for /register — no auth gate, no Sidebar.
 * Centres the form on the dark brand background.
 */
export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-brand-950">
      {children}
    </div>
  );
}
