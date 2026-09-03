import { useEffect, useContext } from "react";
import "./App.css";
import LandingPage from "./LandingPage";
import AdminDashboard from "./AdminDashboard";
import OfficerDashboard from "./OfficerDashboard";
import CitizenDashboard from "./CitizenDashboard";
import { AppContext, AppContextProvider } from "./AppContext";
import { RouterProvider, useRouter } from "./router";

function NavigationSidebar({ role }) {
  const { hash, navigate } = useRouter();
  const { t } = useContext(AppContext);

  if (role === "citizen") {
    return (
      <nav className="sidebar-nav">
        <div className="sidebar-nav-title">{t("citizen_menu")}</div>
        <a
          onClick={() => navigate("#/citizen/overview")}
          className={`sidebar-link ${hash.includes("/citizen/overview") || hash === "#/" ? "sidebar-link-active" : ""}`}
        >
          {t("dashboard_overview")}
        </a>
        <a
          onClick={() => navigate("#/citizen/new-complaint")}
          className={`sidebar-link ${hash.includes("/citizen/new-complaint") ? "sidebar-link-active" : ""}`}
        >
          {t("file_new_complaint")}
        </a>
        <a
          onClick={() => navigate("#/citizen/my-complaints")}
          className={`sidebar-link ${hash.includes("/citizen/my-complaints") || hash.includes("/citizen/complaint/") ? "sidebar-link-active" : ""}`}
        >
          {t("my_complaints")}
        </a>
        <a
          onClick={() => navigate("#/citizen/profile")}
          className={`sidebar-link ${hash.includes("/citizen/profile") ? "sidebar-link-active" : ""}`}
        >
          {t("my_profile")}
        </a>
      </nav>
    );
  }

  if (role === "officer") {
    return (
      <nav className="sidebar-nav">
        <div className="sidebar-nav-title">{t("officer_menu")}</div>
        <a
          onClick={() => navigate("#/officer/overview")}
          className={`sidebar-link ${hash.includes("/officer/overview") || hash === "#/" ? "sidebar-link-active" : ""}`}
        >
          {t("dashboard_overview")}
        </a>
        <a
          onClick={() => navigate("#/officer/queue")}
          className={`sidebar-link ${hash.includes("/officer/queue") || hash.includes("/officer/complaint/") ? "sidebar-link-active" : ""}`}
        >
          {t("my_work_queue")}
        </a>
        <a
          onClick={() => navigate("#/officer/completed")}
          className={`sidebar-link ${hash.includes("/officer/completed") ? "sidebar-link-active" : ""}`}
        >
          {t("completed_history")}
        </a>
        <a
          onClick={() => navigate("#/officer/profile")}
          className={`sidebar-link ${hash.includes("/officer/profile") ? "sidebar-link-active" : ""}`}
        >
          {t("my_profile")}
        </a>
      </nav>
    );
  }

  if (role === "admin") {
    return (
      <nav className="sidebar-nav">
        <div className="sidebar-nav-title">{t("admin_menu")}</div>
        <a
          onClick={() => navigate("#/admin/overview")}
          className={`sidebar-link ${hash.includes("/admin/overview") || hash === "#/" ? "sidebar-link-active" : ""}`}
        >
          {t("dashboard_overview")}
        </a>
        <a
          onClick={() => navigate("#/admin/complaints")}
          className={`sidebar-link ${hash.includes("/admin/complaints") || hash.includes("/admin/complaint/") ? "sidebar-link-active" : ""}`}
        >
          {t("all_complaints")}
        </a>
        <a
          onClick={() => navigate("#/admin/new-complaint")}
          className={`sidebar-link ${hash.includes("/admin/new-complaint") ? "sidebar-link-active" : ""}`}
        >
          File Complaint (On Behalf)
        </a>
        <a
          onClick={() => navigate("#/admin/officers")}
          className={`sidebar-link ${hash.includes("/admin/officers") ? "sidebar-link-active" : ""}`}
        >
          {t("manage_officers")}
        </a>
        <a
          onClick={() => navigate("#/admin/departments")}
          className={`sidebar-link ${hash.includes("/admin/departments") ? "sidebar-link-active" : ""}`}
        >
          {t("manage_departments")}
        </a>
        <a
          onClick={() => navigate("#/admin/reports")}
          className={`sidebar-link ${hash.includes("/admin/reports") ? "sidebar-link-active" : ""}`}
        >
          {t("reports_analytics")}
        </a>
        <a
          onClick={() => navigate("#/admin/profile")}
          className={`sidebar-link ${hash.includes("/admin/profile") ? "sidebar-link-active" : ""}`}
        >
          {t("my_profile")}
        </a>
      </nav>
    );
  }

  return null;
}

function MCMAppInner() {
  const { isLoggedIn, user, logout, language, setLanguage, t } = useContext(AppContext);
  const { hash, navigate } = useRouter();

  // Keep document.title updated
  useEffect(() => {
    document.title = `${t("brand_title")} - ${t("brand_subtitle")}`;
  }, [t]);

  // Redirect to correct dashboard on login
  useEffect(() => {
    if (isLoggedIn && user) {
      if (
        hash === "#/" ||
        hash === "#/login" ||
        hash === "#/about" ||
        hash === "#/sla" ||
        !hash.startsWith(`#/${user.role}`)
      ) {
        navigate(`#/${user.role}/overview`);
      }
    }
  }, [isLoggedIn, user, hash, navigate]);

  if (!isLoggedIn) {
    return <LandingPage />;
  }

  const roleLabel =
    user.role === "admin" ? t("admin") : user.role === "officer" ? t("officer_suffix") : t("citizen");

  return (
    <div className="app-shell">
      <header className="letterhead">
        <div className="letterhead-inner">
          <div className="brand">
            <div className="seal-icon">🏛️</div>
            <div>
              <h1 className="brand-title">{t("brand_title")}</h1>
              <span className="brand-subtitle">{t("brand_subtitle")}</span>
            </div>
          </div>

          <div className="header-right">
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
            <span className="logged-in-as">
              {user.name} · <strong>{roleLabel}</strong>
            </span>
            <button onClick={() => { logout(); navigate("#/"); }} className="logout-btn">
              {t("logout")}
            </button>
          </div>
        </div>
      </header>

      <div className="layout-container">
        <NavigationSidebar role={user.role} />
        <main className="main-content">
          {user.role === "admin" && <AdminDashboard />}
          {user.role === "officer" && <OfficerDashboard />}
          {user.role === "citizen" && <CitizenDashboard />}
        </main>
      </div>

      <footer className="govuk-footer">
        <div className="govuk-footer-inner">
          <div className="govuk-footer-links">
            <a href="#/support">{t("help_support")}</a>
            <a href="#/privacy">{t("privacy_policy")}</a>
            <a href="#/cookies">{t("cookies")}</a>
            <a href="#/accessibility">{t("accessibility_statement")}</a>
          </div>
          <div className="govuk-footer-attribution">
            {t("footer_attribution")}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AppContextProvider>
      <RouterProvider>
        <MCMAppInner />
      </RouterProvider>
    </AppContextProvider>
  );
}
