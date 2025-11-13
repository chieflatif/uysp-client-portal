'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{ padding: '40px', textAlign: 'center', color: 'white' }}>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()} style={{ marginTop: '20px', padding: '10px 20px' }}>
        Try again
      </button>
    </div>
  );
}