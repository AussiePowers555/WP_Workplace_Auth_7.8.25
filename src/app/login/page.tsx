"use client";

import { useState } from "react";

export default function LoginPage() {
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const email = loginEmail.trim();
    const password = loginPassword.trim();

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

      let data;
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        // Response is not JSON, likely an error page
        data = { success: false, error: 'Server error - invalid response format' };
      }

      if (!res.ok || !data?.success) {
        if (messageDiv) messageDiv.textContent = `❌ ${data?.error || 'Invalid credentials.'}`;
        if (submitBtn) submitBtn.disabled = false;
        return;
      }

      // Check if password change is required
      if (data.user.needsPasswordChange) {
        setUserEmail(email);
        setTempPassword(password);
        setNewPassword("");
        setConfirmPassword("");
        setShowPasswordChange(true);
        if (messageDiv) messageDiv.style.display = "none";
        if (submitBtn) submitBtn.disabled = false;
        return;
      }

      // Store a minimal client copy for UI convenience (non-authoritative)
      const userData = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name ?? "User",
        role: data.user.role ?? "user",
        workspaceId: data.user.workspaceId || null,
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

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    const messageDiv = document.getElementById("changeMessage");
    const submitBtn = document.getElementById("changeSubmitBtn") as HTMLButtonElement;

    if (newPassword !== confirmPassword) {
      if (messageDiv) {
        messageDiv.textContent = "❌ Passwords do not match.";
        messageDiv.style.display = "block";
      }
      return;
    }

    // Validate password requirements - Simple
    const passwordErrors = [];
    if (newPassword.length < 6) {
      passwordErrors.push("at least 6 characters");
    }
    if (!/[0-9]/.test(newPassword)) {
      passwordErrors.push("at least one number");
    }
    
    if (passwordErrors.length > 0) {
      if (messageDiv) {
        messageDiv.textContent = `❌ Password must contain: ${passwordErrors.join(" and ")}`;
        messageDiv.style.display = "block";
      }
      return;
    }

    if (messageDiv) {
      messageDiv.textContent = "Updating password...";
      messageDiv.style.display = "block";
    }
    if (submitBtn) submitBtn.disabled = true;

    try {
      // First change the password
      const changeRes = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: userEmail,
          oldPassword: tempPassword,
          newPassword 
        }),
      });

      let changeData;
      const contentType = changeRes.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        changeData = await changeRes.json();
      } else {
        changeData = { success: false, error: 'Server error - invalid response format' };
      }

      if (!changeRes.ok || !changeData?.success) {
        const errorMsg = changeData?.error || "Failed to update password";
        if (messageDiv) messageDiv.textContent = `❌ ${errorMsg}`;
        if (submitBtn) submitBtn.disabled = false;
        console.error('Password change failed:', changeData);
        return;
      }

      // Now login with the new password
      const loginRes = await fetch("/api/auth/simple-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, password: newPassword }),
      });

      let loginData;
      const loginContentType = loginRes.headers.get('content-type');
      if (loginContentType && loginContentType.includes('application/json')) {
        loginData = await loginRes.json();
      } else {
        loginData = { success: false, error: 'Server error - invalid response format' };
      }

      if (loginRes.ok && loginData?.success) {
        // Store user data
        const userData = {
          id: loginData.user.id,
          email: loginData.user.email,
          name: loginData.user.name ?? "User",
          role: loginData.user.role ?? "user",
          workspaceId: loginData.user.workspaceId || null,
        };
        sessionStorage.setItem("currentUser", JSON.stringify(userData));
        window.dispatchEvent(
          new CustomEvent("sessionStorageChange", {
            detail: { key: "currentUser", value: userData },
          })
        );

        if (messageDiv) messageDiv.textContent = "✅ Password updated! Redirecting...";

        // Redirect to dashboard
        setTimeout(() => {
          window.location.href = "/";
        }, 1000);
      } else {
        if (messageDiv) messageDiv.textContent = "❌ Failed to login after password change.";
        if (submitBtn) submitBtn.disabled = false;
      }
    } catch (err) {
      console.error("Password change error:", err);
      if (messageDiv) messageDiv.textContent = "❌ Failed to update password.";
      if (submitBtn) submitBtn.disabled = false;
    }
  };

  const autoFillDev1 = () => {
    setLoginEmail("whitepointer2016@gmail.com");
    setLoginPassword("Tr@ders84");
  };

  if (showPasswordChange) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f9fafb", padding: "20px" }}>
        <div style={{ width: "100%", maxWidth: "400px", backgroundColor: "white", padding: "40px", borderRadius: "8px", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }}>
          <div style={{ textAlign: "center", marginBottom: "30px" }}>
            <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px" }}>Change Your Password</h1>
            <p style={{ color: "#666", fontSize: "14px" }}>You must change your temporary password before continuing</p>
          </div>

          <form onSubmit={handlePasswordChange} style={{ marginBottom: "20px" }}>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: "500" }}>Email</label>
              <input
                type="email"
                value={userEmail}
                disabled
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  backgroundColor: "#f5f5f5",
                  cursor: "not-allowed"
                }}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label htmlFor="newPassword" style={{ display: "block", marginBottom: "6px", fontWeight: "500" }}>New Password</label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                placeholder="Enter your new password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "14px",
                  boxSizing: "border-box"
                }}
              />
              <p style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                Password must be at least 6 characters and contain at least 1 number
              </p>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label htmlFor="confirmPassword" style={{ display: "block", marginBottom: "6px", fontWeight: "500" }}>Confirm New Password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm your new password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              id="changeSubmitBtn"
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
              Update Password
            </button>
          </form>

          <div id="changeMessage" style={{
            padding: "12px",
            backgroundColor: "#f3f4f6",
            borderRadius: "4px",
            fontSize: "14px",
            marginTop: "16px",
            display: "none"
          }}></div>
        </div>
      </div>
    );
  }

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
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
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
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
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
          fontSize: "14px",
          display: "none"
        }}></div>

        <div style={{ borderTop: "1px solid #e5e7eb", marginTop: "24px", paddingTop: "24px" }}>
          <p style={{ fontSize: "12px", color: "#999", textAlign: "center", marginBottom: "12px" }}>Quick access for development:</p>
          <button
            type="button"
            onClick={autoFillDev1}
            style={{
              width: "100%",
              padding: "10px",
              backgroundColor: "#f3f4f6",
              color: "#333",
              border: "1px solid #e5e7eb",
              borderRadius: "4px",
              fontSize: "14px",
              cursor: "pointer"
            }}
          >
            Fill Developer Credentials
          </button>
        </div>
      </div>
    </div>
  );
}