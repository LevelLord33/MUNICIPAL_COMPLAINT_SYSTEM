import { useState, useContext } from "react";
import "./App.css";
import { AppContext } from "./AppContext";

const ROLES = [
  { key: "citizen", label: "Citizen" },
  { key: "officer", label: "Department Officer" },
  { key: "admin", label: "Admin" },
];

export default function Login() {
  const { login, officers } = useContext(AppContext);

  const [role, setRole] = useState("citizen");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedOfficer, setSelectedOfficer] = useState(officers[0]?.name || "");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (role === "citizen") {
      if (!name.trim()) {
        setError("Please enter your full name.");
        return;
      }
      if (!email.trim()) {
        setError("Please enter your email.");
        return;
      }
    } else if (role === "officer") {
      if (!selectedOfficer) {
        setError("Please select an officer profile.");
        return;
      }
      if (!email.trim()) {
        setError("Please enter your official email.");
        return;
      }
    } else if (role === "admin") {
      if (!email.trim()) {
        setError("Please enter your admin email.");
        return;
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address (e.g., name@example.com).");
      return;
    }

    if (password !== "1234") {
      setError("Incorrect password. (Demo password is 1234 for every role.)");
      return;
    }

    setError("");
    login({
      role,
      email,
      name:
        role === "citizen"
          ? name
          : role === "admin"
          ? "Administrator"
          : selectedOfficer,
    });
  };

  return (
    <div className="login-shell">
      <div className="login-card">
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <span style={{ fontSize: "40px" }}>🏛️</span>
          <h1 className="govuk-heading-l" style={{ margin: "10px 0 0 0" }}>Kovilpatti Municipal Complaint System</h1>
          <p className="govuk-body-s" style={{ textTransform: "uppercase", letterSpacing: "1px", fontWeight: "700" }}>
            Municipal.kov.in
          </p>
        </div>

        {error && (
          <div className="govuk-error-summary" aria-labelledby="error-summary-title" role="alert" tabIndex="-1">
            <h2 className="govuk-error-summary__title" id="error-summary-title">
              There is a problem
            </h2>
            <div className="govuk-error-summary__body">
              <ul className="govuk-error-summary__list">
                <li>
                  <a href="#error-field">{error}</a>
                </li>
              </ul>
            </div>
          </div>
        )}

        <div className="login-tabs">
          {ROLES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => {
                setRole(r.key);
                setError("");
              }}
              className={`login-tab ${role === r.key ? "login-tab-active" : ""}`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {role === "citizen" && (
            <div className="govuk-form-group">
              <label className="govuk-label" htmlFor="name">
                Full Name
              </label>
              <span className="govuk-hint">Enter your first and last name</span>
              <input
                className={`govuk-input ${error && !name.trim() ? "govuk-input-error" : ""}`}
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jane Doe"
                required
              />
            </div>
          )}

          {role === "officer" && (
            <div className="govuk-form-group">
              <label className="govuk-label" htmlFor="officer-select">
                Officer Profile
              </label>
              <span className="govuk-hint">Select your official profile name</span>
              <select
                className="govuk-select"
                id="officer-select"
                value={selectedOfficer}
                onChange={(e) => setSelectedOfficer(e.target.value)}
                required
              >
                {officers.map((o) => (
                  <option key={o.officerId} value={o.name}>
                    {o.name} — {o.designation} ({o.department})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="govuk-form-group">
            <label className="govuk-label" htmlFor="email">
              {role === "citizen" ? "Email Address" : "Official Email Address"}
            </label>
            <span className="govuk-hint">
              {role === "citizen"
                ? "We will send progress alerts here"
                : "Enter your official municipal email"}
            </span>
            <input
              className={`govuk-input ${error && !email.trim() ? "govuk-input-error" : ""}`}
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={
                role === "citizen"
                  ? "name@example.com"
                  : role === "admin"
                  ? "admin@municipal.kov.in"
                  : `${selectedOfficer.toLowerCase().replace(/\s+/g, "")}@municipal.kov.in`
              }
              required
            />
          </div>

          <div className="govuk-form-group">
            <label className="govuk-label" htmlFor="password">
              Security Password
            </label>
            <span className="govuk-hint">Use demo password: 1234</span>
            <input
              className={`govuk-input ${error && password !== "1234" ? "govuk-input-error" : ""}`}
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="govuk-button" style={{ width: "100%" }}>
            Access Portal as {role === "citizen" ? "Citizen" : role === "admin" ? "Admin" : "Officer"}
          </button>
        </form>

        <div style={{ marginTop: "25px", borderTop: "2px solid var(--govuk-black)", paddingTop: "15px" }}>
          <h3 className="govuk-heading-m" style={{ fontSize: "16px", marginBottom: "5px" }}>Official Demo Access</h3>
          <p className="govuk-body-s">
            This is a mock sandbox environment. Use any name/email and password <strong>1234</strong> to enter.
          </p>
        </div>
      </div>
    </div>
  );
}
