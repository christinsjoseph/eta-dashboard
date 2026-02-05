import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRegister = async () => {
    setError("");
    setSuccess("");

    // Basic Validations
    if (!name || !email || !password || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE}/api/auth/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess("User created successfully! Redirecting to login...");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setError(data.message || "Failed to create user");
      }
    } catch (err) {
      setError("Server not reachable");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      <div
        style={{
          background: "white",
          padding: "40px",
          borderRadius: "20px",
          width: "420px",
          boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: 20 }}>
          Create New Account
        </h2>

        {error && (
          <p style={{ color: "red", textAlign: "center" }}>{error}</p>
        )}

        {success && (
          <p style={{ color: "green", textAlign: "center" }}>{success}</p>
        )}

        {/* Name Field */}
        <div style={{ marginBottom: 10 }}>
          <label>Full Name</label>
          <input
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "6px",
              borderRadius: "8px",
              border: "1px solid #ccc",
            }}
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Email Field */}
        <div style={{ marginBottom: 10 }}>
          <label>Email</label>
          <input
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "6px",
              borderRadius: "8px",
              border: "1px solid #ccc",
            }}
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Password Field */}
        <div style={{ marginBottom: 10 }}>
          <label>Password</label>
          <input
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "6px",
              borderRadius: "8px",
              border: "1px solid #ccc",
            }}
            type="password"
            placeholder="Create password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* CONFIRM PASSWORD FIELD (ADDED) */}
        <div style={{ marginBottom: 10 }}>
          <label>Confirm Password</label>
          <input
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "6px",
              borderRadius: "8px",
              border: "1px solid #ccc",
            }}
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        {/* Register Button */}
        <button
          style={{
            width: "100%",
            padding: "12px",
            marginTop: "10px",
            background: "#10b981",
            color: "white",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
          onClick={handleRegister}
        >
          Create Account
        </button>

        {/* Login Link */}
        <div style={{ marginTop: 15, textAlign: "center" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#667eea", fontWeight: "bold" }}>
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
