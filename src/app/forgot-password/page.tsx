export default function ForgotPasswordPage() {
  return (
    <div className="starfield-bg min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg-void)" }}>
      <div className="cosmic-panel p-8 text-center max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>Password Recovery</h1>
        <p className="mb-6" style={{ color: "var(--text-secondary)" }}>
          Contact your system administrator or Safety Officer to reset your NovaFleet credentials.
        </p>
        <a href="/login" className="btn-primary w-full inline-block text-center py-2">
          Return to Login
        </a>
      </div>
    </div>
  );
}
