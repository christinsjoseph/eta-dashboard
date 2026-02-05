import { useState, useEffect } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleLogin = async () => {
  setIsLoading(true);
  setError("");

  try {
    const API_BASE = import.meta.env.VITE_API_BASE;
    if (!API_BASE) throw new Error("API base URL not configured");

    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    console.log("LOGIN RESPONSE:", data);

    if (!res.ok) {
      throw new Error(data.message || "Login failed");
    }

    const token = data.token || data.accessToken;
    if (!token) {
      throw new Error("Token not received from server");
    }

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(data.user || {}));
    window.location.href = "/";
  } catch (err: any) {
    setError(err.message || "Connection failed. Please try again.");
  } finally {
    setIsLoading(false);
  }
};

  

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "linear-gradient(135deg, #0a0a14 0%, #1a0f2e 50%, #0f0a1e 100%)",
        display: "grid",
        placeItems: "center",
        position: "relative",
        overflow: "hidden",
        isolation: "isolate",
      }}
    >
      {/* Animated gradient orbs */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `
            radial-gradient(ellipse 800px 600px at ${mousePos.x}px ${mousePos.y}px, rgba(79, 70, 229, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 15% 25%, rgba(139, 92, 246, 0.12) 0%, transparent 45%),
            radial-gradient(ellipse at 85% 75%, rgba(168, 85, 247, 0.1) 0%, transparent 50%)
          `,
          opacity: mounted ? 1 : 0,
          transition: "opacity 1.5s ease, background 0.3s ease",
        }}
      />

      {/* Floating particles */}
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: `${Math.random() * 4 + 2}px`,
            height: `${Math.random() * 4 + 2}px`,
            background: "rgba(168, 85, 247, 0.4)",
            borderRadius: "50%",
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `float ${Math.random() * 10 + 15}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 5}s`,
            filter: "blur(1px)",
          }}
        />
      ))}

      {/* Main ultra-premium glass card */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "480px",
          padding: "60px 52px",
          borderRadius: "40px",
          background: "rgba(15, 15, 28, 0.45)",
          backdropFilter: "blur(40px) saturate(180%)",
          WebkitBackdropFilter: "blur(40px) saturate(180%)",
          border: "1.5px solid rgba(255,255,255,0.1)",
          boxShadow: `
            0 50px 140px -30px rgba(0,0,0,0.8),
            inset 0 1px 0 0 rgba(255,255,255,0.12),
            inset 0 -1px 0 0 rgba(0,0,0,0.5),
            0 0 100px -20px rgba(124,58,237,0.3)
          `,
          animation: "cardReveal 1.4s cubic-bezier(0.16, 1, 0.3, 1)",
          transform: mounted ? "none" : "translateY(60px) scale(0.92)",
          opacity: mounted ? 1 : 0,
        }}
      >
        {/* Holographic shimmer overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "40px",
            background: `
              linear-gradient(135deg, 
                transparent 0%, 
                rgba(168, 85, 247, 0.08) 25%, 
                rgba(139, 92, 246, 0.08) 50%,
                rgba(79, 70, 229, 0.08) 75%,
                transparent 100%
              )
            `,
            animation: "shimmer 8s ease-in-out infinite",
            pointerEvents: "none",
          }}
        />

        {/* Premium logo with 3D effect */}
        <div
          style={{
            width: "96px",
            height: "96px",
            margin: "0 auto 44px",
            background: "linear-gradient(145deg, #5b21b6, #7c3aed, #a855f7)",
            borderRadius: "30px",
            display: "grid",
            placeItems: "center",
            fontSize: "48px",
            color: "white",
            boxShadow: `
              0 25px 70px -15px rgba(124,58,237,0.6),
              inset 0 2px 0 rgba(255,255,255,0.3),
              inset 0 -2px 4px rgba(0,0,0,0.3)
            `,
            transform: "rotate(-3deg) perspective(1000px) rotateX(5deg)",
            transition: "all 0.8s cubic-bezier(0.16,1,0.3,1)",
            animation: "logoFloat 6s ease-in-out infinite",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "rotate(0deg) perspective(1000px) rotateX(0deg) scale(1.05)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "rotate(-3deg) perspective(1000px) rotateX(5deg)";
          }}
        >
          ✧
        </div>

        <h1
          style={{
            textAlign: "center",
            fontSize: "2.6rem",
            fontWeight: 900,
            letterSpacing: "-1.5px",
            background: "linear-gradient(135deg, #ffffff, #e0e7ff, #f3e8ff, #fae8ff)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: "14px",
            animation: "titleFade 1.6s ease-out",
            textShadow: "0 0 60px rgba(168, 85, 247, 0.3)",
          }}
        >
          Welcome Back
        </h1>

        <p
          style={{
            textAlign: "center",
            color: "#b4b4bb",
            fontSize: "1.05rem",
            marginBottom: "48px",
            letterSpacing: "-0.2px",
            opacity: 0,
            animation: "fadeUp 1.2s 0.5s forwards",
          }}
        >
          Sign in to continue your journey
        </p>

        {error && (
          <div
            style={{
              padding: "16px 22px",
              background: "rgba(220, 38, 38, 0.12)",
              border: "1.5px solid rgba(239,68,68,0.35)",
              borderRadius: "18px",
              color: "#fca5a5",
              fontSize: "0.96rem",
              textAlign: "center",
              marginBottom: "32px",
              animation: "shake 0.6s cubic-bezier(0.36,0,0.66,1)",
              boxShadow: "0 8px 24px -8px rgba(220,38,38,0.4)",
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* Ultra-premium floating label inputs */}
        <div style={{ position: "relative", marginBottom: "32px" }}>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setFocused("email")}
            onBlur={() => setFocused(null)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            style={{
              width: "100%",
              padding: "20px 22px 10px",
              borderRadius: "18px",
              border: "1.5px solid",
              borderColor: focused === "email" ? "#a855f7" : "rgba(161,161,170,0.25)",
              background: focused === "email" 
                ? "rgba(30,30,50,0.5)" 
                : "rgba(20,20,38,0.4)",
              color: "white",
              fontSize: "1.08rem",
              transition: "all 0.4s cubic-bezier(0.16,1,0.3,1)",
              outline: "none",
              boxShadow: focused === "email" 
                ? "0 0 0 5px rgba(168,85,247,0.15), 0 8px 32px -8px rgba(168,85,247,0.4)" 
                : "inset 0 1px 2px rgba(0,0,0,0.3)",
            }}
          />
          <label
            htmlFor="email"
            style={{
              position: "absolute",
              left: "22px",
              top: focused === "email" || email ? "11px" : "20px",
              fontSize: focused === "email" || email ? "0.8rem" : "1.08rem",
              color: focused === "email" ? "#c084fc" : "#9ca3af",
              fontWeight: focused === "email" || email ? 600 : 400,
              pointerEvents: "none",
              transition: "all 0.4s cubic-bezier(0.16,1,0.3,1)",
              transform: focused === "email" || email ? "translateY(-7px)" : "none",
              opacity: focused === "email" || email ? 1 : 0.65,
              letterSpacing: focused === "email" || email ? "0.3px" : "0",
            }}
          >
            Email address
          </label>
          {focused === "email" && (
            <div
              style={{
                position: "absolute",
                bottom: "-1.5px",
                left: "0",
                right: "0",
                height: "1.5px",
                background: "linear-gradient(90deg, transparent, #a855f7, transparent)",
                animation: "glow 2s ease-in-out infinite",
              }}
            />
          )}
        </div>

        <div style={{ position: "relative", marginBottom: "48px" }}>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setFocused("password")}
            onBlur={() => setFocused(null)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder=" "
            style={{
              width: "100%",
              padding: "20px 22px 10px",
              borderRadius: "18px",
              border: "1.5px solid",
              borderColor: focused === "password" ? "#a855f7" : "rgba(161,161,170,0.25)",
              background: focused === "password" 
                ? "rgba(30,30,50,0.5)" 
                : "rgba(20,20,38,0.4)",
              color: "white",
              fontSize: "1.08rem",
              transition: "all 0.4s cubic-bezier(0.16,1,0.3,1)",
              outline: "none",
              boxShadow: focused === "password" 
                ? "0 0 0 5px rgba(168,85,247,0.15), 0 8px 32px -8px rgba(168,85,247,0.4)" 
                : "inset 0 1px 2px rgba(0,0,0,0.3)",
            }}
          />
          <label
            htmlFor="password"
            style={{
              position: "absolute",
              left: "22px",
              top: focused === "password" || password ? "11px" : "20px",
              fontSize: focused === "password" || password ? "0.8rem" : "1.08rem",
              color: focused === "password" ? "#c084fc" : "#9ca3af",
              fontWeight: focused === "password" || password ? 600 : 400,
              pointerEvents: "none",
              transition: "all 0.4s cubic-bezier(0.16,1,0.3,1)",
              transform: focused === "password" || password ? "translateY(-7px)" : "none",
              opacity: focused === "password" || password ? 1 : 0.65,
              letterSpacing: focused === "password" || password ? "0.3px" : "0",
            }}
          >
            Password
          </label>
          {focused === "password" && (
            <div
              style={{
                position: "absolute",
                bottom: "-1.5px",
                left: "0",
                right: "0",
                height: "1.5px",
                background: "linear-gradient(90deg, transparent, #a855f7, transparent)",
                animation: "glow 2s ease-in-out infinite",
              }}
            />
          )}
        </div>

        {/* Ultra-premium button */}
        <button
          disabled={isLoading}
          onClick={handleLogin}
          style={{
            position: "relative",
            width: "100%",
            padding: "20px",
            background: isLoading
              ? "rgba(107,114,128,0.25)"
              : "linear-gradient(135deg, #6d28d9 0%, #7c3aed 30%, #a855f7 70%, #c084fc 100%)",
            color: "white",
            border: "none",
            borderRadius: "18px",
            fontSize: "1.12rem",
            fontWeight: 700,
            letterSpacing: "0.3px",
            cursor: isLoading ? "not-allowed" : "pointer",
            overflow: "hidden",
            boxShadow: isLoading
              ? "none"
              : "0 24px 70px -15px rgba(124,58,237,0.65), inset 0 1px 0 rgba(255,255,255,0.2)",
            transition: "all 0.5s cubic-bezier(0.16,1,0.3,1)",
            transform: "translateZ(0)",
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.transform = "translateY(-5px) scale(1.01)";
              e.currentTarget.style.boxShadow = "0 36px 90px -20px rgba(124,58,237,0.85), inset 0 1px 0 rgba(255,255,255,0.3)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoading) {
              e.currentTarget.style.transform = "translateY(0) scale(1)";
              e.currentTarget.style.boxShadow = "0 24px 70px -15px rgba(124,58,237,0.65), inset 0 1px 0 rgba(255,255,255,0.2)";
            }
          }}
        >
          {isLoading ? (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" }}>
              <span style={{ animation: "spin 1s linear infinite", fontSize: "1.3rem" }}>⟳</span>
              Authenticating...
            </span>
          ) : (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
              Sign In
              <span style={{ fontSize: "1.2rem", transition: "transform 0.3s ease" }}>→</span>
            </span>
          )}

          {/* Animated shine effect */}
          {!isLoading && (
            <>
              <div
                style={{
                  position: "absolute",
                  top: "-50%",
                  left: "-100%",
                  width: "60%",
                  height: "200%",
                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
                  transform: "skewX(-20deg)",
                  animation: "shine 3s ease-in-out infinite",
                  pointerEvents: "none",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "18px",
                  background: "linear-gradient(135deg, rgba(255,255,255,0.1), transparent)",
                  pointerEvents: "none",
                }}
              />
            </>
          )}
        </button>

        <div
          style={{
            marginTop: "40px",
            textAlign: "center",
            color: "#a1a1aa",
            fontSize: "0.98rem",
          }}
        >
          New here?{" "}
          <a
            href="#"
            style={{
              color: "#c084fc",
              fontWeight: 600,
              textDecoration: "none",
              transition: "all 0.3s ease",
              position: "relative",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#e9d5ff";
              e.currentTarget.style.letterSpacing = "0.3px";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#c084fc";
              e.currentTarget.style.letterSpacing = "0";
            }}
          >
            Create your account
          </a>
        </div>
      </div>

      <style>{`
        @keyframes cardReveal {
          from {
            opacity: 0;
            transform: translateY(80px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }

        @keyframes titleFade {
          from { opacity: 0; transform: translateY(25px); }
          to   { opacity: 1; transform: none; }
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: none; }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-10px); }
          40%, 80% { transform: translateX(10px); }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        @keyframes shimmer {
          0%, 100% { transform: translateX(-100%); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateX(100%); }
        }

        @keyframes logoFloat {
          0%, 100% { transform: rotate(-3deg) perspective(1000px) rotateX(5deg) translateY(0px); }
          50% { transform: rotate(-3deg) perspective(1000px) rotateX(5deg) translateY(-8px); }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.3; }
          50% { transform: translateY(-20px) translateX(10px); opacity: 0.6; }
        }

        @keyframes glow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }

        @keyframes shine {
          0% { left: -100%; }
          50%, 100% { left: 150%; }
        }

        * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
}