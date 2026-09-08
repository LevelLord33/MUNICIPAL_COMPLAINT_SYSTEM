import { useState, useContext, useEffect } from "react";
import "./App.css";
import { AppContext } from "./AppContext";

const ROLES = [
  { key: "citizen", label: "Citizen" },
  { key: "officer", label: "Department Officer" },
  { key: "admin", label: "Admin" },
];

export default function Login() {
  const { login, officers, citizens, registerCitizen } = useContext(AppContext);

  const [role, setRole] = useState("citizen");
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [selectedOfficer, setSelectedOfficer] = useState(officers[0]?.name || "");
  const [error, setError] = useState("");
  const [regSuccess, setRegSuccess] = useState("");

  // Initialize selected officer when officers load
  useEffect(() => {
    if (officers && officers.length > 0 && !selectedOfficer) {
      const first = officers[0];
      const firstName = typeof first === "string" ? first : first?.name || "";
      setSelectedOfficer(firstName);
    }
  }, [officers, selectedOfficer]);

  // Auto-fill the email field when officer role is selected or selected officer changes
  useEffect(() => {
    if (role === "officer" && officers && officers.length > 0) {
      const activeOfficer = selectedOfficer || (typeof officers[0] === "string" ? officers[0] : officers[0]?.name);
      if (!selectedOfficer && activeOfficer) {
        setSelectedOfficer(activeOfficer);
      }
      const officerObj = officers.find(o => (typeof o === "string" ? o : o.name) === activeOfficer);
      if (officerObj && typeof officerObj !== "string" && officerObj.email) {
        setEmail(officerObj.email);
      }
    }
  }, [selectedOfficer, role, officers]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setRegSuccess("");

    if (role === "citizen") {
      if (isRegistering) {
        if (!name.trim()) {
          setError("Please enter your full name.");
          return;
        }
        if (!phone.trim()) {
          setError("Please enter your phone number.");
          return;
        }
        if (!address.trim()) {
          setError("Please enter your residential address.");
          return;
        }
        if (!email.trim()) {
          setError("Please enter your email.");
          return;
        }
        if (!password.trim()) {
          setError("Please enter a password.");
          return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          setError("Please enter a valid email address.");
          return;
        }

        try {
          if (registerCitizen) {
            registerCitizen({
              name: name.trim(),
              email: email.trim(),
              phone: phone.trim(),
              address: address.trim(),
              password: password.trim(),
            });
          }
          setRegSuccess("Registration successful! You can now log in with your email.");
          setIsRegistering(false);
          setPassword("");
        } catch (err) {
          setError(err.message);
        }
      } else {
        if (!email.trim()) {
          setError("Please enter your email.");
          return;
        }
        if (!password.trim()) {
          setError("Please enter your password.");
          return;
        }

        const citizen = citizens?.find((c) => c.email.toLowerCase() === email.toLowerCase());
        if (citizen && citizen.password !== password) {
          setError("Incorrect password.");
          return;
        }

        login({
          role: "citizen",
          email,
          name: citizen ? citizen.name : name || "Citizen User",
          phone: citizen ? citizen.phone : phone,
          address: citizen ? citizen.address : address,
        });
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

      const officerObj = officers?.find((o) => (typeof o === "string" ? o : o.name) === selectedOfficer);
      if (officerObj && typeof officerObj !== "string" && officerObj.email.toLowerCase() !== email.toLowerCase()) {
        setError("Email does not match selected officer profile.");
        return;
      }

      if (password !== "1234") {
        setError("Incorrect password. (Demo password is 1234 for every role.)");
        return;
      }

      login({
        role: "officer",
        email,
        name: selectedOfficer,
        designation: officerObj?.designation,
        department: officerObj?.department,
        phone: officerObj?.phone,
      });
    } else if (role === "admin") {
      if (!email.trim()) {
        setError("Please enter your admin email.");
        return;
      }
      if (password !== "1234") {
        setError("Incorrect password. (Demo password is 1234 for every role.)");
        return;
      }

      login({
        role: "admin",
        email,
        name: "Administrator",
      });
    }
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

        {regSuccess && (
          <div className="login-success-banner" style={{ backgroundColor: "#dff0d8", color: "#3c763d", padding: "10px 15px", borderRadius: "4px", marginBottom: "15px", border: "1px solid #d6e9c6" }}>
            ✅ {regSuccess}
          </div>
        )}

        <div className="seg-control seg-control--full" style={{ marginBottom: "20px" }}>
          {ROLES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => {
                setRole(r.key);
                setError("");
                setRegSuccess("");
                if (r.key === "officer") {
                  const activeOfficer = selectedOfficer || (officers && (typeof officers[0] === "string" ? officers[0] : officers[0]?.name));
                  const officerObj = officers?.find((o) => (typeof o === "string" ? o : o.name) === activeOfficer);
                  if (officerObj && typeof officerObj !== "string") setEmail(officerObj.email);
                } else if (r.key === "admin") {
                  setEmail("admin@municipal.kov.in");
                }
              }}
              className={`seg-control__btn ${role === r.key ? "seg-control__btn--active" : ""}`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {role === "citizen" && (
          <div className="seg-control seg-control--full" style={{ marginBottom: "20px" }}>
            <button
              type="button"
              className={`seg-control__btn ${!isRegistering ? "seg-control__btn--active" : ""}`}
              onClick={() => { setIsRegistering(false); setError(""); }}
            >
              Log In
            </button>
            <button
              type="button"
              className={`seg-control__btn ${isRegistering ? "seg-control__btn--active" : ""}`}
              onClick={() => { setIsRegistering(true); setError(""); }}
            >
              Register Account
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          {role === "citizen" && isRegistering && (
            <>
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

              <div className="govuk-form-group">
                <label className="govuk-label" htmlFor="phone">
                  Phone Number
                </label>
                <span className="govuk-hint">Enter 10-digit mobile number</span>
                <input
                  className={`govuk-input ${error && !phone.trim() ? "govuk-input-error" : ""}`}
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 94421 99999"
                  required
                />
              </div>

              <div className="govuk-form-group">
                <label className="govuk-label" htmlFor="address">
                  Residential Address
                </label>
                <span className="govuk-hint">Enter street address in Kovilpatti</span>
                <input
                  className={`govuk-input ${error && !address.trim() ? "govuk-input-error" : ""}`}
                  id="address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 12 Main Road, Ward 4"
                  required
                />
              </div>
            </>
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
                onChange={(e) => {
                  const newOfficer = e.target.value;
                  setSelectedOfficer(newOfficer);
                  const officerObj = officers?.find((o) => (typeof o === "string" ? o : o.name) === newOfficer);
                  if (officerObj && typeof officerObj !== "string" && officerObj.email) {
                    setEmail(officerObj.email);
                  }
                }}
                required
              >
                {officers.map((o) => {
                  const oName = typeof o === "string" ? o : o.name;
                  const oLabel = typeof o === "string" ? `${o} (Officer)` : `${o.name} — ${o.designation} (${o.department})`;
                  return (
                    <option key={oName} value={oName}>
                      {oLabel}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          <div className="govuk-form-group">
            <label className="govuk-label" htmlFor="email">
              {role === "citizen" ? "Email Address" : "Official Email Address"}
              {role === "officer" && (
                <span style={{ fontWeight: "400", fontSize: "12px", color: "#6b7280", marginLeft: "8px" }}>
                  (auto-filled from profile)
                </span>
              )}
            </label>
            <span className="govuk-hint">
              {role === "citizen"
                ? "We will send progress alerts here"
                : "Official registered municipal email"}
            </span>
            <input
              className={`govuk-input ${error && !email.trim() ? "govuk-input-error" : ""}`}
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              readOnly={role === "officer"}
              style={role === "officer" ? { backgroundColor: "#f3f4f6", cursor: "not-allowed" } : {}}
              placeholder={
                role === "citizen"
                  ? "name@example.com"
                  : role === "admin"
                  ? "admin@municipal.kov.in"
                  : "Select an officer profile above"
              }
              required
            />
          </div>

          <div className="govuk-form-group">
            <label className="govuk-label" htmlFor="password">
              Security Password
            </label>
            <span className="govuk-hint">
              {role === "citizen" && isRegistering ? "Choose a secure password" : "Use demo password: 1234"}
            </span>
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
            {role === "citizen" && isRegistering
              ? "Register New Account"
              : `Access Portal as ${role === "citizen" ? "Citizen" : role === "admin" ? "Admin" : "Officer"}`}
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

