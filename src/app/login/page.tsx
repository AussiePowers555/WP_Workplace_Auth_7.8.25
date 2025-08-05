"use client";

export default function LoginPage() {
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const messageDiv = document.getElementById("message");
    const submitBtn = document.getElementById("submitBtn") as HTMLButtonElement;

    if (messageDiv) {
      messageDiv.textContent = "Attempting login...";
      messageDiv.style.display = "block";
    }
    if (submitBtn) submitBtn.disabled = true;

    try {
      // Use API route which seeds dev accounts, authenticates, and sets httpOnly cookie
      const res = await fetch("/api/auth/simple-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        if (messageDiv) messageDiv.textContent = "❌ Invalid credentials.";
        if (submitBtn) submitBtn.disabled = false;
        return;
      }

      // Store a minimal client copy for UI convenience (non-authoritative)
      const userData = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name ?? "User",
        role: data.user.role ?? "user",
        workspaceId: null,
      };
      sessionStorage.setItem("currentUser", JSON.stringify(userData));
      window.dispatchEvent(
        new CustomEvent("sessionStorageChange", {
          detail: { key: "currentUser", value: userData },
        })
      );

      if (messageDiv) messageDiv.textContent = "✅ Login successful! Redirecting...";

      // Redirect to next or dashboard
      const url = new URL(window.location.href);
      const next = url.searchParams.get("next") || "/";
      setTimeout(() => {
        try {
          window.location.href = next;
        } catch {
          try {
            window.location.replace(next);
          } catch {
            window.location.assign(next);
          }
        }
      }, 200);
    } catch (err) {
      console.error("Login error:", err);
      if (messageDiv) messageDiv.textContent = "❌ Login failed. Please try again.";
      if (submitBtn) submitBtn.disabled = false;
    }
  };

  const autoFillDev1 = () => {
    const emailInput = document.getElementById("email") as HTMLInputElement;
    const passwordInput = document.getElementById("password") as HTMLInputElement;
    if (emailInput) emailInput.value = "whitepointer2016@gmail.com";
    if (passwordInput) passwordInput.value = "Tr@ders84";
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f9fafb", padding: "20px" }}>
      <div style={{ width: "100%", maxWidth: "400px", backgroundColor: "white", padding: "40px", borderRadius: "8px", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }}>
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px" }}>PBikeRescue</h1>
          <p style={{ color: "#666", fontSize: "14px" }}>Sign in to access your workspace</p>
        </div>

        <form onSubmit={handleLogin} style={{ marginBottom: "20px" }}>
          <div style={{ marginBottom: "16px" }}>
            <label htmlFor="email" style={{ display: "block", marginBottom: "6px", fontWeight: "500" }}>Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              required
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "14px",
                boxSizing: "border-box"
              }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label htmlFor="password" style={{ display: "block", marginBottom: "6px", fontWeight: "500" }}>Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              required
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "14px",
                boxSizing: "border-box"
              }}
            />
          </div>

          <button
            id="submitBtn"
            type="submit"
            style={{
              width: "100%",
              padding: "12px",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontSize: "16px",
              fontWeight: "500",
              cursor: "pointer"
            }}
          >
            Sign In
          </button>
        </form>

        <div id="message" style={{
          padding: "12px",
          backgroundColor: "#f3f4f6",
          borderRadius: "4px",
          marginBottom: "20px",
          fontSize: "14px",
          display: "none"
        }}>
        </div>

        <div style={{ paddingTop: "20px", borderTop: "1px solid #e5e7eb" }}>
          <p style={{ fontSize: "14px", fontWeight: "500", marginBottom: "12px" }}>Test Account:</p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", color: "#666" }}>
            <div>
              <p><strong>Email:</strong> whitepointer2016@gmail.com</p>
              <p><strong>Password:</strong> Tr@ders84</p>
            </div>
            <button
              type="button"
              onClick={autoFillDev1}
              style={{
                padding: "6px 12px",
                border: "1px solid #ddd",
                backgroundColor: "white",
                borderRadius: "4px",
                fontSize: "12px",
                cursor: "pointer"
              }}
            >
              Auto-fill
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}