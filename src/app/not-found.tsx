export default function NotFound() {
  return (
    <div style={{ padding: '40px', textAlign: 'center', color: 'white' }}>
      <h1>404 - Page Not Found</h1>
      <p>The page you are looking for does not exist.</p>
      <a href="/dashboard" style={{ color: '#06b6d4' }}>Go to Dashboard</a>
    </div>
  );
}