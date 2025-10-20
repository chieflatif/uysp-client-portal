/**
 * Auth Layout
 * 
 * Wraps all authentication pages (login, register)
 * No navigation bar - clean auth experience
 */

export const metadata = {
  title: 'UYSP Client Portal - Authentication',
  description: 'Login or register for UYSP Client Portal',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      {children}
    </div>
  );
}
