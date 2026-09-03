import { useState, useContext, useEffect } from "react";
import { AppContext } from "./AppContext";
import { useRouter } from "./router";
import KovilpattiOfficeImg from "./assets/kovilpatti_municipal_office.png";
import "./App.css";

const LOCAL_TRANS = {
  ta: {
    "Garbage": "குப்பை அகற்றுதல்",
    "Water": "குடிநீர் விநியோகம்",
    "Electricity": "மின்சாரம்",
    "Streetlight": "தெருவிளக்கு",
    "Road": "சாலை சீரமைப்பு",
    
    "Garbage Collection & Cleansing": "குப்பை சேகரிப்பு மற்றும் சுத்தம் செய்தல்",
    "Water Supply & Leakage Repair": "நீர் விநியோகம் & கசிவு பழுதுபார்ப்பு",
    "Public Lighting & Electricity Issues": "பொது விளக்குகள் & மின்சார சிக்கல்கள்",
    "Streetlight Maintenance & Replacement": "தெருவிளக்கு பராமரிப்பு & மாற்றுதல்",
    "Road Repair, Potholes & Debris": "சாலை சீரமைப்பு, பள்ளங்கள் & குப்பைகள்",

    "12 Hours": "12 மணிநேரம்",
    "24 Hours": "24 மணிநேரம்",
    "48 Hours": "48 மணிநேரம்",
    "72 Hours": "72 மணிநேரம்",

    "Arun Vel (Sanitation Inspector)": "அருண் வேல் (சுகாதார ஆய்வாளர்)",
    "Priya Selvam (Water Works Engineer)": "பிரியா செல்வம் (குடிநீர் வாரிய பொறியாளர்)",
    "Ramesh Kumar (Electrical Inspector)": "ரமேஷ் குமார் (மின்சார ஆய்வாளர்)",
    "Priya Selvam (Assistant Engineer - Roads)": "பிரியா செல்வம் (உதவி பொறியாளர் - சாலைகள்)",

    "Municipal Commissioner": "நகராட்சி ஆணையர்",
    "Assistant Executive Engineer": "உதவி செயற் பொறியாளர்",

    "Complaint registered by citizen with photo/location": "புகார் குடிமகனால் புகைப்படம் மற்றும் இருப்பிடத்துடன் பதிவு செய்யப்படுகிறது",
    "Auto-assigned to Sanitation Supervisor of the area": "அந்தப் பகுதியின் சுகாதாரக் கண்காணிப்பாளருக்கு தானாகவே ஒதுக்கப்படுகிறது",
    "Sanitation staff dispatched to site for cleaning": "சுத்தம் செய்வதற்காக சுகாதாரப் பணியாளர்கள் தளத்திற்கு அனுப்பப்படுகிறார்கள்",
    "Completion photo uploaded by Officer for verification": "சரிபார்ப்பிற்காக அதிகாரி மூலம் நிறைவு செய்யப்பட்ட புகைப்படம் பதிவேற்றப்படுகிறது",
    "Citizen confirmation and closure of complaint": "குடிமகன் உறுதிப்படுத்தல் மற்றும் புகாரை மூடுதல்",
    "Complaint submitted describing water pipeline leakage or supply issue": "தண்ணீர் குழாய் கசிவு அல்லது விநியோக சிக்கலை விவரிக்கும் புகார் சமர்ப்பிக்கப்படுகிறது",
    "Assigned to Water Works department inspector": "குடிநீர் வாரியத் துறை ஆய்வாளருக்கு ஒதுக்கப்படுகிறது",
    "Technical team visits site for leak detection and repair": "கசிவைக் கண்டறிந்து பழுதுபார்க்க தொழில்நுட்பக் குழு தளத்தைப் பார்வையிடுகிறது",
    "Water pressure and supply quality tested post-rectification": "பழுதுபார்க்கப்பட்ட பின் நீர் அழுத்தம் மற்றும் விநியோக தரம் சோதிக்கப்படுகிறது",
    "Feedback collected from affected household": "பாதிக்கப்பட்ட வீட்டிலிருந்து கருத்து சேகரிக்கப்படுகிறது",
    "Complaint filed regarding power fluctuation or high voltage concerns": "மின்சார ஏற்ற இறக்கம் அல்லது உயர் மின்னழுத்தம் குறித்து புகார் தாக்கல் செய்யப்படுகிறது",
    "Assigned to Electrical Department Junior Engineer": "மின்சாரத் துறை இளநிலைப் பொறியாளருக்கு ஒதுக்கப்படுகிறது",
    "Line worker dispatched to check local transformer/cabling": "உள்ளூர் மின்மாற்றி/கேபிளிங்கைச் சரிபார்க்க தடம் பணியாளர் அனுப்பப்படுகிறார்",
    "Restoration of stable power supply": "நிலையான மின் விநியோகம் மீட்டெடுக்கப்படுகிறது",
    "Complaint status marked completed": "புகார் நிலை முடிவடைந்ததாகக் குறிக்கப்படுகிறது",
    "Complaint filed indicating location of faulty streetlight": "பழுதடைந்த தெருவிளக்கின் இருப்பிடத்தைக் குறிப்பிட்டு புகார் தாக்கல் செய்யப்படுகிறது",
    "Assigned to maintenance contractor or crew": "பராமரிப்பு ஒப்பந்ததாரர் அல்லது குழுவிற்கு ஒதுக்கப்படுகிறது",
    "Replacement of faulty bulb, LED driver, or wiring": "பழுதடைந்த விளக்கு, எல்.ஈ.டி டிரைவர் அல்லது வயரிங் மாற்றப்படுகிறது",
    "Night inspection to verify operational streetlight status": "தெருவிளக்கு செயல்படும் நிலையை சரிபார்க்க இரவு நேர ஆய்வு செய்யப்படுகிறது",
    "System marked resolved with updated status": "புதுப்பிக்கப்பட்ட நிலையுடன் கணினியில் தீர்க்கப்பட்டதாகக் குறிக்கப்படுகிறது",
    "Complaint filed detailing pothole size or debris accumulation": "குழியின் அளவு அல்லது குப்பைகள் குவிந்திருப்பதை விவரிக்கும் புகார் தாக்கல் செய்யப்படுகிறது",
    "Assigned to Roads & Public Works division": "சாலைகள் மற்றும் பொதுப்பணித் துறைக்கு ஒதுக்கப்படுகிறது",
    "Patchwork/filling materials arranged and site visited by repair team": "ஒட்டுவேலை/நிரப்பும் பொருட்கள் ஏற்பாடு செய்யப்பட்டு பழுதுபார்க்கும் குழுவினர் தளத்திற்குச் செல்கின்றனர்",
    "Road patch completed and leveled with roller": "சாலை ஒட்டுவேலை முடிக்கப்பட்டு ரோலர் மூலம் சமப்படுத்தப்படுகிறது",
    "Site cleared and marked closed": "தளம் சுத்தம் செய்யப்பட்டு மூடப்பட்டதாகக் குறிக்கப்படுகிறது"
  }
};


const SLA_DATA = {
  Garbage: {
    title: "Garbage Collection & Cleansing",
    time: "12 Hours",
    officer: "Arun Vel (Sanitation Inspector)",
    escalation: "Municipal Commissioner",
    icon: "🗑️",
    color: "#e53e3e",
    steps: [
      "Complaint registered by citizen with photo/location",
      "Auto-assigned to Sanitation Supervisor of the area",
      "Sanitation staff dispatched to site for cleaning",
      "Completion photo uploaded by Officer for verification",
      "Citizen confirmation and closure of complaint"
    ]
  },
  Water: {
    title: "Water Supply & Leakage Repair",
    time: "48 Hours",
    officer: "Priya Selvam (Water Works Engineer)",
    escalation: "Municipal Commissioner",
    icon: "💧",
    color: "#3182ce",
    steps: [
      "Complaint submitted describing water pipeline leakage or supply issue",
      "Assigned to Water Works department inspector",
      "Technical team visits site for leak detection and repair",
      "Water pressure and supply quality tested post-rectification",
      "Feedback collected from affected household"
    ]
  },
  Electricity: {
    title: "Public Lighting & Electricity Issues",
    time: "24 Hours",
    officer: "Ramesh Kumar (Electrical Inspector)",
    escalation: "Assistant Executive Engineer",
    icon: "⚡",
    color: "#d69e2e",
    steps: [
      "Complaint filed regarding power fluctuation or high voltage concerns",
      "Assigned to Electrical Department Junior Engineer",
      "Line worker dispatched to check local transformer/cabling",
      "Restoration of stable power supply",
      "Complaint status marked completed"
    ]
  },
  Streetlight: {
    title: "Streetlight Maintenance & Replacement",
    time: "24 Hours",
    officer: "Ramesh Kumar (Electrical Inspector)",
    escalation: "Assistant Executive Engineer",
    icon: "💡",
    color: "#ecc94b",
    steps: [
      "Complaint filed indicating location of faulty streetlight",
      "Assigned to maintenance contractor or crew",
      "Replacement of faulty bulb, LED driver, or wiring",
      "Night inspection to verify operational streetlight status",
      "System marked resolved with updated status"
    ]
  },
  Road: {
    title: "Road Repair, Potholes & Debris",
    time: "72 Hours",
    officer: "Priya Selvam (Assistant Engineer - Roads)",
    escalation: "Municipal Commissioner",
    icon: "🛣️",
    color: "#4a5568",
    steps: [
      "Complaint filed detailing pothole size or debris accumulation",
      "Assigned to Roads & Public Works division",
      "Patchwork/filling materials arranged and site visited by repair team",
      "Road patch completed and leveled with roller",
      "Site cleared and marked closed"
    ]
  }
};

export default function LandingPage() {
  const { login, officers, complaints, language, setLanguage, t, citizens, registerCitizen } = useContext(AppContext);
  const { hash, navigate } = useRouter();

  const lt = (val) => {
    if (language === "ta" && LOCAL_TRANS.ta[val]) {
      return LOCAL_TRANS.ta[val];
    }
    return val;
  };


  // Selected SLA category
  const [selectedSla, setSelectedSla] = useState("Garbage");

  // Login/Register states
  const [role, setRole] = useState("citizen");
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [selectedOfficer, setSelectedOfficer] = useState("");
  const [loginError, setLoginError] = useState("");
  const [regSuccess, setRegSuccess] = useState("");

  // Initialize selected officer when officers load
  useEffect(() => {
    if (officers && officers.length > 0 && !selectedOfficer) {
      setSelectedOfficer(officers[0].name);
    }
  }, [officers, selectedOfficer]);

  // Statistics calculation
  const totalReceived = complaints.length + 42; // Add mock baseline
  const totalResolved = complaints.filter(c => c.status === "Completed" || c.status === "Closed").length + 38;
  const slaCompliance = Math.round((totalResolved / totalReceived) * 100) || 94;
  const avgHours = "18.5 hrs";

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setLoginError("");
    setRegSuccess("");

    if (role === "citizen") {
      if (isRegistering) {
        if (!name.trim()) {
          setLoginError(t("login_err_name"));
          return;
        }
        if (!email.trim()) {
          setLoginError(t("login_err_email"));
          return;
        }
        if (!phone.trim()) {
          setLoginError("Please enter your phone number.");
          return;
        }
        if (!address.trim()) {
          setLoginError("Please enter your address.");
          return;
        }
        if (!password.trim()) {
          setLoginError("Please enter a password.");
          return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          setLoginError(t("login_err_invalid_email"));
          return;
        }

        try {
          registerCitizen({
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
            address: address.trim(),
            password: password.trim()
          });
          setRegSuccess("Registration successful! You can now access your account using your email and password.");
          setIsRegistering(false);
          setPassword("");
        } catch (err) {
          setLoginError(err.message);
        }
      } else {
        // Citizen login
        if (!email.trim()) {
          setLoginError(t("login_err_email"));
          return;
        }
        if (!password.trim()) {
          setLoginError("Please enter your password.");
          return;
        }

        const citizen = citizens.find(c => c.email.toLowerCase() === email.toLowerCase());
        if (!citizen) {
          setLoginError("No citizen account found with this email. Please register first.");
          return;
        }

        if (citizen.password !== password) {
          setLoginError("Incorrect password. Please try again.");
          return;
        }

        login({
          role: "citizen",
          email: citizen.email,
          name: citizen.name,
          phone: citizen.phone,
          address: citizen.address
        });
      }
    } else if (role === "officer") {
      if (!selectedOfficer) {
        setLoginError(t("login_err_officer"));
        return;
      }
      if (!email.trim()) {
        setLoginError(t("login_err_officer_email"));
        return;
      }

      const officerObj = officers.find(o => o.name === selectedOfficer);
      if (!officerObj) {
        setLoginError("Selected officer profile not found.");
        return;
      }

      if (officerObj.email.toLowerCase() !== email.toLowerCase()) {
        setLoginError("Invalid email for the selected officer profile.");
        return;
      }

      if (password !== "1234") {
        setLoginError(t("login_err_password"));
        return;
      }

      login({
        role: "officer",
        email: officerObj.email,
        name: officerObj.name,
        designation: officerObj.designation,
        department: officerObj.department,
        phone: officerObj.phone
      });
    } else if (role === "admin") {
      if (!email.trim()) {
        setLoginError(t("login_err_admin_email"));
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setLoginError(t("login_err_invalid_email"));
        return;
      }

      if (email.toLowerCase() !== "admin@municipal.kov.in") {
        setLoginError("Invalid admin email address.");
        return;
      }

      if (password !== "1234") {
        setLoginError(t("login_err_password"));
        return;
      }

      login({
        role: "admin",
        email: email,
        name: "Administrator"
      });
    }
  };

  // Scroll to active hash element
  useEffect(() => {
    if (hash === "#/sla") {
      const el = document.getElementById("sla-section");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } else if (hash === "#/login") {
      const el = document.getElementById("login-section");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } else if (hash === "#/about") {
      const el = document.getElementById("about-section");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [hash]);

  return (
    <div className="landing-container">
      {/* Header Bar */}
      <header className="landing-header">
        <div className="landing-header-inner">
          <div className="landing-brand">
            <span className="landing-seal">🏛️</span>
            <div>
              <h1 className="landing-title">{t("portal_title")}</h1>
              <span className="landing-subtitle">{t("tn_gov")}</span>
            </div>
          </div>
          <div className="landing-header-right" style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <div className="lang-switcher">
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`lang-btn ${language === "en" ? "active" : ""}`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage("ta")}
                className={`lang-btn ${language === "ta" ? "active" : ""}`}
              >
                தமிழ்
              </button>
            </div>
            <nav className="landing-nav">
              <a onClick={() => navigate("#/")} className={hash === "#/" || hash === "" ? "nav-active" : ""}>{t("home")}</a>
              <a onClick={() => navigate("#/about")} className={hash === "#/about" ? "nav-active" : ""}>{t("about")}</a>
              <a onClick={() => navigate("#/sla")} className={hash === "#/sla" ? "nav-active" : ""}>{t("sla_metrics")}</a>
              <a onClick={() => navigate("#/login")} className="nav-login-btn">{t("sign_in")}</a>
              <a href="tel:1800123456" className="nav-help-btn">📞 {t("helpdesk")}</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="landing-hero">
        <div className="hero-image-container">
          <img src={KovilpattiOfficeImg} alt="Kovilpatti Municipal Office" className="hero-image" />
          <div className="hero-overlay">
            <div className="hero-content">
              <h2>{t("hero_title")}</h2>
              <p>{t("hero_desc")}</p>
              <div className="hero-buttons">
                <button onClick={() => navigate("#/login")} className="hero-btn-primary">{t("file_a_complaint")}</button>
                <button onClick={() => navigate("#/sla")} className="hero-btn-secondary">{t("check_sla")}</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard KPI Stats */}
      <section className="landing-stats">
        <div className="stats-inner">
          <div className="stat-card">
            <h3>{totalReceived}</h3>
            <p>{t("total_filed")}</p>
          </div>
          <div className="stat-card">
            <h3>{totalResolved}</h3>
            <p>{t("resolved_count")}</p>
          </div>
          <div className="stat-card compliance-card">
            <h3>{slaCompliance}%</h3>
            <p>{t("compliance_rate")}</p>
          </div>
          <div className="stat-card">
            <h3>{avgHours}</h3>
            <p>{t("resolution_time")}</p>
          </div>
        </div>
      </section>


      {/* About Section */}
      <section id="about-section" className="landing-about">
        <div className="section-inner">
          <h2 className="section-heading">{t("about_title")}</h2>
          <p className="section-desc">
            {t("about_desc")}
          </p>
          <div className="about-features">
            <div className="feature-item">
              <span className="feature-icon">🛡️</span>
              <h4>{t("assured_res")}</h4>
              <p>{t("assured_res_desc")}</p>
            </div>
            <div className="feature-item">
              <span className="feature-icon">⚡</span>
              <h4>{t("sla_tracked")}</h4>
              <p>{t("sla_tracked_desc")}</p>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📊</span>
              <h4>{t("open_data")}</h4>
              <p>{t("open_data_desc")}</p>
            </div>
          </div>
        </div>
      </section>


      {/* SLA Grid & Detailed Viewer */}
      <section id="sla-section" className="landing-sla">
        <div className="section-inner">
          <h2 className="section-heading">{t("sla_metrics")}</h2>
          <p className="section-desc">
            {t("sla_section_desc")}
          </p>

          <div className="sla-grid">
            {Object.entries(SLA_DATA).map(([key, item]) => (
              <button
                key={key}
                className={`sla-card ${selectedSla === key ? "sla-card-selected" : ""}`}
                onClick={() => setSelectedSla(key)}
                style={{ "--border-hover-color": item.color }}
              >
                <span className="sla-card-icon">{item.icon}</span>
                <h4>{lt(key)}</h4>
                <p>{t("sla_target")}: <strong>{lt(item.time)}</strong></p>
              </button>
            ))}
          </div>

          <div className="sla-details-viewer">
            <div className="sla-details-header" style={{ borderLeftColor: SLA_DATA[selectedSla].color }}>
              <h3>{lt(SLA_DATA[selectedSla].title)}</h3>
              <div className="sla-badge">{t("sla_target")}: {lt(SLA_DATA[selectedSla].time)}</div>
            </div>
            <div className="sla-details-content">
              <div className="sla-info-box">
                <p><strong>{t("nodal_officer")}:</strong> {lt(SLA_DATA[selectedSla].officer)}</p>
                <p><strong>{t("escalation_auth")}:</strong> {lt(SLA_DATA[selectedSla].escalation)}</p>
              </div>
              <div className="sla-workflow">
                <h4>{t("workflow_title")}</h4>
                <ol className="sla-steps-list">
                  {SLA_DATA[selectedSla].steps.map((step, idx) => (
                    <li key={idx}>{lt(step)}</li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Integrated Login Portal Section */}
      <section id="login-section" className="landing-login">
        <div className="login-card-wrapper">
          <div className="login-header">
            <span className="login-logo">🏛️</span>
            <h3>{t("access_portal")}</h3>
            <p>{t("login_sub")}</p>
          </div>

          {loginError && (
            <div className="login-error-banner" style={{ backgroundColor: "#f2dede", color: "#a94442", padding: "10px 15px", borderRadius: "4px", marginBottom: "15px", border: "1px solid #ebccd1" }}>
              ⚠️ {loginError}
            </div>
          )}

          {regSuccess && (
            <div className="login-success-banner" style={{ backgroundColor: "#dff0d8", color: "#3c763d", padding: "10px 15px", borderRadius: "4px", marginBottom: "15px", border: "1px solid #d6e9c6" }}>
              ✅ {regSuccess}
            </div>
          )}

          <div className="login-roles-tabs">
            <button
              type="button"
              className={`login-role-tab ${role === "citizen" ? "active-role" : ""}`}
              onClick={() => { setRole("citizen"); setLoginError(""); setRegSuccess(""); }}
            >
              {t("citizen")}
            </button>
            <button
              type="button"
              className={`login-role-tab ${role === "officer" ? "active-role" : ""}`}
              onClick={() => { setRole("officer"); setLoginError(""); setRegSuccess(""); }}
            >
              {t("officer")}
            </button>
            <button
              type="button"
              className={`login-role-tab ${role === "admin" ? "active-role" : ""}`}
              onClick={() => { setRole("admin"); setLoginError(""); setRegSuccess(""); }}
            >
              {t("admin")}
            </button>
          </div>

          {role === "citizen" && (
            <div style={{ display: "flex", gap: "10px", margin: "10px 0 20px 0", borderBottom: "1px solid #ccc", paddingBottom: "10px" }}>
              <button
                type="button"
                className={`govuk-button govuk-button--secondary`}
                style={{ flex: 1, fontWeight: !isRegistering ? "700" : "400", background: !isRegistering ? "#ddd" : "" }}
                onClick={() => { setIsRegistering(false); setLoginError(""); }}
              >
                Log In
              </button>
              <button
                type="button"
                className={`govuk-button govuk-button--secondary`}
                style={{ flex: 1, fontWeight: isRegistering ? "700" : "400", background: isRegistering ? "#ddd" : "" }}
                onClick={() => { setIsRegistering(true); setLoginError(""); }}
              >
                Register Account
              </button>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="login-form-body">
            {role === "citizen" && isRegistering && (
              <>
                <div className="login-input-group">
                  <label htmlFor="landing-name">{t("full_name")}</label>
                  <input
                    id="landing-name"
                    type="text"
                    placeholder={t("name_placeholder")}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="login-input-group">
                  <label htmlFor="landing-phone">Phone Number</label>
                  <input
                    id="landing-phone"
                    type="tel"
                    placeholder="e.g. +91 94421 99999"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
                <div className="login-input-group">
                  <label htmlFor="landing-address">Residential Address</label>
                  <input
                    id="landing-address"
                    type="text"
                    placeholder="Enter your street and area name"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            {role === "officer" && (
              <div className="login-input-group">
                <label htmlFor="landing-officer">{t("officer_profile")}</label>
                <select
                  id="landing-officer"
                  value={selectedOfficer}
                  onChange={(e) => setSelectedOfficer(e.target.value)}
                  required
                >
                  {officers.map((o) => (
                    <option key={o.name} value={o.name}>
                      {o.name} ({o.designation})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="login-input-group">
              <label htmlFor="landing-email">{t("email_address")}</label>
              <input
                id="landing-email"
                type="email"
                placeholder={
                  role === "citizen"
                    ? "name@example.com"
                    : role === "admin"
                    ? "admin@municipal.kov.in"
                    : `${(selectedOfficer || "officer").toLowerCase().replace(/\s+/g, "")}@municipal.kov.in`
                }
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="login-input-group">
              <label htmlFor="landing-password">{t("demo_password")}</label>
              <input
                id="landing-password"
                type="password"
                placeholder={role === "citizen" && isRegistering ? "Choose a secure password" : t("password_hint")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {!(role === "citizen" && isRegistering) && (
                <span className="input-hint">
                  {role === "citizen" ? "Use your registered password" : `${t("security_hint")} 1234`}
                </span>
              )}
            </div>

            <button type="submit" className="login-submit-button">
              {role === "citizen" && isRegistering
                ? "Register New Account"
                : `${t("access_dashboard")} ${role === "citizen" ? t("citizen") : role === "admin" ? t("admin") : t("officer")}`}
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="footer-links">
            <a onClick={() => navigate("#/")}>{t("home")}</a>
            <a onClick={() => navigate("#/about")}>{t("about_us")}</a>
            <a onClick={() => navigate("#/sla")}>{t("sla_tenders")}</a>
            <a href="#/privacy">{t("privacy_policy")}</a>
            <a href="#/cookies">{t("cookies")}</a>
          </div>
          <div className="footer-copyright">
            {t("footer_copyright")}
          </div>
        </div>
      </footer>
    </div>
  );
}
