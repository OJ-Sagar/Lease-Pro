export function ProtectedRoute({ children }) {
  // AUTH SETUP LATER:
  // Re-enable the login gate by restoring the session check below.
  //
  // const { session, loading } = useAuth();
  // if (loading) return <div className="grid min-h-screen place-items-center text-muted-foreground">Loading secure workspace...</div>;
  // if (!session) return <Navigate to="/login" replace />;
  return children;
}
