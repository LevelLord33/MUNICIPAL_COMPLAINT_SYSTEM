import { useState, useMemo, useRef, useContext, useEffect } from "react";
import { STATUSES, ticketNo } from "./shared";
import { AppContext } from "./AppContext";
import { useRouter, matchRoute } from "./router";
import CitizenChatbot from "./CitizenChatbot";

function GdsProgressStepper({ status }) {
  const stageIndex = STATUSES.indexOf(status);
  return (
    <div className="govuk-stepper">
      {STATUSES.map((s, i) => {
        let stepClass = "govuk-stepper__step";
        if (i < stageIndex) {
          stepClass += " govuk-stepper__step--completed";
        } else if (i === stageIndex) {
          stepClass += " govuk-stepper__step--active";
        }
        return (
          <div key={s} className={stepClass}>
            <span className="govuk-stepper__title">{s}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function CitizenDashboard() {
  const { complaints, submitComplaint, withdrawComplaint, user, categories, t } = useContext(AppContext);
  const { hash, navigate } = useRouter();


  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(categories && categories.length > 0 ? categories[0] : "");
  const [location, setLocation] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [photos, setPhotos] = useState([]);
  const [photoError, setPhotoError] = useState("");
  const [humanCheck, setHumanCheck] = useState(false);

  // Profile states
  const [profilePassword, setProfilePassword] = useState("1234");
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  // UX states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [successTicket, setSuccessTicket] = useState(null);
  const [formErrors, setFormErrors] = useState([]);

  // Withdrawal form state
  const [withdrawReason, setWithdrawReason] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const fileInputRef = useRef(null);

  // Pre-fill category from chatbot deep-link: #/citizen/new-complaint?category=Road
  useEffect(() => {
    const hashStr = window.location.hash || "";
    const queryIndex = hashStr.indexOf("?");
    if (queryIndex === -1) return;
    const params = new URLSearchParams(hashStr.slice(queryIndex + 1));
    const cat = params.get("category");
    if (cat && categories && categories.includes(cat)) {
      setCategory(cat);
    }
  }, [hash, categories]);


  // Filter complaints logged by this citizen
  const myComplaints = useMemo(() => {
    return complaints.filter((c) => c.citizenEmail === user.email);
  }, [complaints, user.email]);

  // Citizen stats
  const userStats = useMemo(() => {
    const total = myComplaints.length;
    const pending = myComplaints.filter((c) => ["Submitted", "Assigned", "In Progress"].includes(c.status)).length;
    const resolved = myComplaints.filter((c) => ["Completed", "Closed"].includes(c.status)).length;
    return { total, pending, resolved };
  }, [myComplaints]);

  // Image reading helper with verification
  const processFile = (file) => {
    setPhotoError("");
    if (!file) return;

    if (photos.length >= 3) {
      setPhotoError("You can upload a maximum of 3 photos per complaint.");
      return;
    }

    // Verify file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setPhotoError("The selected file must be an image (JPG, PNG, or WebP).");
      return;
    }

    // Verify file size (< 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setPhotoError("Each evidence photo must be smaller than 5 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotos((prev) => [...prev, reader.result]);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = [];
    if (!title.trim()) errors.push("Enter a complaint title.");
    if (!description.trim()) errors.push("Enter a detailed description of the issue.");
    if (!location.trim()) errors.push("Enter the specific location or landmark.");
    if (!humanCheck) errors.push("Confirm that the details provided are accurate (human check).");

    // Spam prevention / Rate limit check
    const lastSub = localStorage.getItem("last_sub_" + user.email);
    const now = Date.now();
    if (lastSub && now - parseInt(lastSub, 10) < 60000) {
      const remaining = Math.ceil((60000 - (now - parseInt(lastSub, 10))) / 1000);
      errors.push(`Spam Protection: Please wait ${remaining} seconds before filing another complaint.`);
    }

    if (errors.length > 0) {
      setFormErrors(errors);
      window.scrollTo(0, 0);
      return;
    }

    setFormErrors([]);
    setIsSubmitting(true);
    setSuccessTicket(null);

    // Simulate 1s async submission
    setTimeout(() => {
      const nextId = complaints.length > 0 ? Math.max(...complaints.map((c) => c.complaintId)) + 1 : 1;
      submitComplaint({ title, description, category, location, priority, photo: photos });
      localStorage.setItem("last_sub_" + user.email, Date.now().toString());
      setSuccessTicket(ticketNo(nextId));
      setIsSubmitting(false);

      // Reset form
      setTitle("");
      setDescription("");
      setCategory(categories && categories.length > 0 ? categories[0] : "");
      setLocation("");
      setPriority("Medium");
      setPhotos([]);
      setHumanCheck(false);
    }, 1000);
  };

  // Search & Filtered Citizen Complaints
  const filteredMyComplaints = useMemo(() => {
    return myComplaints.filter((c) => {
      const categoryOk = filterCategory === "All" || c.category === filterCategory;
      const statusOk = filterStatus === "All" || c.status === filterStatus;
      
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        c.title.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query) ||
        c.location.toLowerCase().includes(query) ||
        ticketNo(c.complaintId).toLowerCase().includes(query);

      return categoryOk && statusOk && matchesSearch;
    });
  }, [myComplaints, filterCategory, filterStatus, searchQuery]);

  // Route matches
  const matchDetail = matchRoute("/citizen/complaint/:id", hash);

  // 1. Complaint Detail Page
  if (matchDetail.matches) {
    const cId = parseInt(matchDetail.params.id, 10);
    // Strict Data Boundary Check: Ensure they can only see their own complaint
    const complaint = complaints.find((c) => c.complaintId === cId && c.citizenEmail === user.email);

    if (!complaint) {
      return (
        <>
          <div>
            <h2 className="govuk-heading-l">Access Denied / Complaint Not Found</h2>
            <p className="govuk-body">You do not have permission to view this record, or the ticket ID is invalid.</p>
            <button className="govuk-button govuk-button--secondary" onClick={() => navigate("#/citizen/my-complaints")}>
              {t("go_back")}
            </button>
          </div>
          <CitizenChatbot />
        </>
      );
    }

    const handleWithdraw = (e) => {
      e.preventDefault();
      if (!withdrawReason.trim()) {
        alert("Please provide a cancellation reason.");
        return;
      }
      setIsWithdrawing(true);
      setTimeout(() => {
        withdrawComplaint(complaint.complaintId, withdrawReason.trim());
        setWithdrawReason("");
        setIsWithdrawing(false);
      }, 800);
    };

    const hasPhotos = Array.isArray(complaint.photo)
      ? complaint.photo.length > 0
      : !!complaint.photo;

    return (
      <>
        <div>
        <a onClick={() => navigate("#/citizen/my-complaints")} className="govuk-body" style={{ textDecoration: "underline", color: "var(--govuk-blue)", cursor: "pointer", display: "inline-block", marginBottom: "20px" }}>
          ← {t("go_back")}
        </a>
        <h2 className="govuk-heading-xl">{t("ticket")}: {ticketNo(complaint.complaintId)}</h2>
        
        <div style={{ background: "#ffffff", padding: "30px", border: "1px solid var(--border-color)", marginBottom: "30px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: "20px" }}>
            <div>
              <span className="govuk-hint">{t("category_label")}</span>
              <p className="govuk-body" style={{ fontWeight: "700" }}>{t(complaint.category)}</p>
            </div>
            <div>
              <span className="govuk-hint">{t("priority_label")}</span>
              <p className="govuk-body" style={{ fontWeight: "700" }}>{t(complaint.priority)}</p>
            </div>
            <div>
              <span className="govuk-hint">{t("comp_loc_label")}</span>
              <p className="govuk-body" style={{ fontWeight: "700" }}>{complaint.location}</p>
            </div>
            <div>
              <span className="govuk-hint">{t("status_label")}</span>
              <div>
                <span className={`govuk-tag ${
                  complaint.status === "Completed" ? "govuk-tag--green" :
                  complaint.status === "In Progress" ? "govuk-tag--orange" :
                  complaint.status === "Assigned" ? "govuk-tag--purple" :
                  complaint.status === "Withdrawn" ? "govuk-tag--grey" : "govuk-tag--blue"
                }`}>
                  {t(complaint.status)}
                </span>
              </div>
            </div>
          </div>

          <h3 className="govuk-heading-m">{complaint.title}</h3>
          <p className="govuk-body">{complaint.description}</p>

          {hasPhotos && (
            <div style={{ margin: "20px 0" }}>
              <h4 className="govuk-heading-m" style={{ fontSize: "18px" }}>{t("photo_label")}</h4>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {Array.isArray(complaint.photo) ? (
                  complaint.photo.map((p, idx) => (
                    <img key={idx} src={p} style={{ maxWidth: "200px", maxHeight: "200px", border: "2px solid var(--govuk-black)" }} alt={`Evidence ${idx + 1}`} />
                  ))
                ) : (
                  <img src={complaint.photo} style={{ maxWidth: "100%", maxHeight: "400px", border: "2px solid var(--govuk-black)" }} alt="Evidence" />
                )}
              </div>
            </div>
          )}

          {complaint.assignedOfficer && (
            <div style={{ background: "var(--govuk-light-grey)", padding: "15px", marginTop: "20px" }}>
              <p className="govuk-body-s">
                <strong>{t("assigned_officer")}:</strong> {complaint.assignedOfficer}
              </p>
            </div>
          )}
        </div>

        {/* Withdraw Panel for active complaints */}
        {["Submitted", "Assigned", "In Progress"].includes(complaint.status) && (
          <div style={{ background: "#fcf8e3", padding: "20px", borderLeft: "5px solid #f0ad4e", marginBottom: "30px", position: "relative" }}>
            {isWithdrawing && (
              <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(255,255,255,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 10 }}>
                <div style={{ border: "4px solid #f3f3f3", borderTop: "4px solid var(--govuk-blue)", borderRadius: "50%", width: "30px", height: "30px", animation: "spin 1s linear infinite" }}></div>
              </div>
            )}
            <h4 className="govuk-heading-m" style={{ marginTop: 0 }}>Withdraw Complaint</h4>
            <p className="govuk-body-s">If the issue is solved or you want to retract this complaint, provide a brief reason and cancel it.</p>
            <form onSubmit={handleWithdraw}>
              <div className="govuk-form-group" style={{ padding: 0, border: "none" }}>
                <input
                  className="govuk-input"
                  type="text"
                  placeholder="e.g. Issue resolved on its own / duplicate entry."
                  value={withdrawReason}
                  onChange={(e) => setWithdrawReason(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="govuk-button govuk-button--warning" style={{ marginBottom: 0 }}>
                Cancel Complaint
              </button>
            </form>
          </div>
        )}

        <h3 className="govuk-heading-l">{t("resolution_progress")}</h3>
        <GdsProgressStepper status={complaint.status} />

        <h3 className="govuk-heading-m">{t("progress_log_title")}</h3>

        <div className="govuk-timeline">
          {complaint.progressLog.map((log, index) => (
            <div key={index} className="govuk-timeline__item">
              <span className="govuk-timeline__date">{log.date}</span>
              <h4 className="govuk-timeline__title">{log.status}</h4>
              <p className="govuk-timeline__desc">{log.remarks}</p>
            </div>
          ))}
        </div>
        </div>
        <CitizenChatbot />
      </>
    );
  }

  // 2. File New Complaint Page
  if (hash.includes("/citizen/new-complaint")) {
    return (
      <>
        <div>
        <h2 className="govuk-heading-xl">{t("file_new_title")}</h2>
        <p className="govuk-body">{t("file_new_desc")}</p>

        {formErrors.length > 0 && (
          <div className="govuk-error-summary" role="alert">
            <h2 className="govuk-error-summary__title">{t("login_err_name")}</h2>
            <ul className="govuk-error-summary__list">
              {formErrors.map((err, idx) => (
                <li key={idx}>
                  <a href="#form-form">{err}</a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {successTicket && (
          <div className="govuk-panel govuk-panel--confirmation">
            <h1 className="govuk-panel__title">{t("success_banner_title")}</h1>
            <div className="govuk-panel__body">
              {t("success_ticket_no")}<br />
              <strong>{successTicket}</strong>
            </div>
          </div>
        )}


        <form onSubmit={handleSubmit} id="form-form" style={{ position: "relative" }}>
          {isSubmitting && (
            <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(255,255,255,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 10 }}>
              <div style={{ border: "4px solid #f3f3f3", borderTop: "4px solid var(--govuk-blue)", borderRadius: "50%", width: "40px", height: "40px", animation: "spin 1s linear infinite" }}></div>
            </div>
          )}

          <div className="govuk-form-group">
            <label className="govuk-label" htmlFor="title">
              {t("comp_title_label")}
            </label>
            <span className="govuk-hint">{t("comp_title_placeholder")}</span>
            <input
              className="govuk-input"
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="govuk-form-group">
            <label className="govuk-label" htmlFor="desc">
              {t("comp_desc_label")}
            </label>
            <span className="govuk-hint">{t("comp_desc_placeholder")}</span>
            <textarea
              className="govuk-input"
              style={{ minHeight: "150px" }}
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="govuk-form-group">
            <label className="govuk-label" htmlFor="cat">
              {t("comp_cat_label")}
            </label>
            <span className="govuk-hint">{t("comp_cat_label")}</span>
            <select className="govuk-select" id="cat" value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map((c) => (
                <option key={c} value={c}>{t(c)}</option>
              ))}
            </select>
          </div>

          <div className="govuk-form-group">
            <label className="govuk-label" htmlFor="priority">
              {t("comp_prio_label")}
            </label>
            <span className="govuk-hint">{t("comp_prio_label")}</span>
            <select className="govuk-select" id="priority" value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="Low">{t("Low")}</option>
              <option value="Medium">{t("Medium")}</option>
              <option value="High">{t("High")}</option>
            </select>
          </div>


          <div className="govuk-form-group">
            <label className="govuk-label" htmlFor="location">
              {t("comp_loc_label")}
            </label>
            <span className="govuk-hint">{t("comp_loc_placeholder")}</span>
            <input
              className="govuk-input"
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
          </div>

          <div className="govuk-form-group">
            <label className="govuk-label">
              {t("photo_label")}
            </label>
            <span className="govuk-hint">{t("photo_label")}</span>
            
            <div
              className={`govuk-file-upload-box ${dragActive ? "drag-active" : ""}`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current.click()}
            >
              <span style={{ fontSize: "28px" }}>📸</span>
              <p className="govuk-body" style={{ margin: "5px 0" }}>{dragActive ? t("photo_drag_active") : t("photo_drag_inactive")}</p>
              <span className="govuk-hint">PNG, JPG, or WebP (Up to 3 photos, max 5MB each)</span>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={(e) => {
                  if (e.target.files) {
                    Array.from(e.target.files).forEach(processFile);
                  }
                }}
                style={{ display: "none" }}
              />
            </div>

            {photoError && (
              <span className="govuk-error-message">
                <span className="govuk-visually-hidden">Error:</span> {photoError}
              </span>
            )}

            {photos.length > 0 && (
              <div style={{ marginTop: "15px" }}>
                <p className="govuk-body" style={{ fontWeight: "700" }}>Loaded Photos ({photos.length}/3)</p>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  {photos.map((p, idx) => (
                    <div key={idx} className="govuk-file-upload-preview" style={{ margin: 0, position: "relative" }}>
                      <img src={p} style={{ width: "80px", height: "80px", objectFit: "cover" }} alt={`Preview ${idx + 1}`} />
                      <button
                        type="button"
                        className="govuk-button govuk-button--secondary"
                        style={{
                          position: "absolute",
                          top: "-5px",
                          right: "-5px",
                          padding: "2px 6px",
                          fontSize: "12px",
                          background: "red",
                          color: "white",
                          borderRadius: "50%",
                          border: "none",
                          cursor: "pointer"
                        }}
                        onClick={() => setPhotos((prev) => prev.filter((_, i) => i !== idx))}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="govuk-form-group" style={{ background: "#fcf8e3", borderLeft: "5px solid #f0ad4e" }}>
            <label className="govuk-label" style={{ fontSize: "16px", display: "flex", gap: "10px", alignItems: "center" }}>
              <input
                type="checkbox"
                checked={humanCheck}
                onChange={(e) => setHumanCheck(e.target.checked)}
                style={{ width: "20px", height: "20px" }}
              />
              <span>{t("bot_check")}</span>
            </label>
          </div>

          <button type="submit" className="govuk-button">
            {isSubmitting ? t("submitting_btn") : t("submit_btn")}
          </button>
        </form>
      </div>
      <CitizenChatbot />
    </>
    );
  }


  // 3. My Complaints List Page
  if (hash.includes("/citizen/my-complaints")) {
    return (
      <>
        <div>
        <h2 className="govuk-heading-xl">{t("my_complaints_title")}</h2>
        <p className="govuk-body">{t("my_complaints_sub")}</p>

        {/* Filter controls */}
        <div style={{ background: "#ffffff", padding: "20px", border: "1px solid var(--border-color)", marginBottom: "30px" }}>
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "200px" }}>
              <label className="govuk-label" style={{ fontSize: "16px" }} htmlFor="search">{t("search_placeholder").split("...")[0]}</label>
              <input
                className="govuk-input"
                id="search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("search_placeholder")}
              />
            </div>
            <div>
              <label className="govuk-label" style={{ fontSize: "16px" }} htmlFor="category">{t("filter_cat")}</label>
              <select className="govuk-select" id="category" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                <option value="All">{t("all_categories")}</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{t(c)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="govuk-label" style={{ fontSize: "16px" }} htmlFor="status">{t("filter_status")}</label>
              <select className="govuk-select" id="status" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="All">{t("all_statuses")}</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{t(s)}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <table className="govuk-table">
          <thead>
            <tr>
              <th className="govuk-table__header">{t("ticket")}</th>
              <th className="govuk-table__header">{t("comp_title_label")}</th>
              <th className="govuk-table__header">{t("category_label")}</th>
              <th className="govuk-table__header">{t("comp_loc_label")}</th>
              <th className="govuk-table__header">{t("priority_label")}</th>
              <th className="govuk-table__header">{t("status_label")}</th>
              <th className="govuk-table__header">{t("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {filteredMyComplaints.map((c) => (
              <tr className="govuk-table__row" key={c.complaintId}>
                <td className="govuk-table__cell" style={{ fontWeight: "700" }}>{ticketNo(c.complaintId)}</td>
                <td className="govuk-table__cell">{c.title}</td>
                <td className="govuk-table__cell">{t(c.category)}</td>
                <td className="govuk-table__cell">{c.location}</td>
                <td className="govuk-table__cell">
                  <span style={{ fontWeight: c.priority === "High" ? "700" : "400", color: c.priority === "High" ? "var(--govuk-red)" : "inherit" }}>
                    {t(c.priority)}
                  </span>
                </td>
                <td className="govuk-table__cell">
                  <span className={`govuk-tag ${
                    c.status === "Completed" ? "govuk-tag--green" :
                    c.status === "In Progress" ? "govuk-tag--orange" :
                    c.status === "Assigned" ? "govuk-tag--purple" : "govuk-tag--blue"
                  }`}>
                    {t(c.status)}
                  </span>
                </td>
                <td className="govuk-table__cell">
                  <button className="govuk-button govuk-button--secondary" style={{ padding: "4px 8px", fontSize: "14px" }} onClick={() => navigate(`#/citizen/complaint/${c.complaintId}`)}>
                    {t("view_details")}
                  </button>
                </td>
              </tr>
            ))}
            {filteredMyComplaints.length === 0 && (
              <tr>
                <td className="govuk-table__cell" colSpan={7} style={{ textAlign: "center" }}>
                  {t("no_matching_complaints")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <CitizenChatbot />
    </>
    );
  }


  // 4. Citizen Profile Page
  if (hash.includes("/citizen/profile")) {
    return (
      <>
        <div>
        <h2 className="govuk-heading-xl">{t("my_profile_title")}</h2>
        <p className="govuk-body">{t("my_profile_desc")}</p>

        <div style={{ background: "#ffffff", padding: "30px", border: "1px solid var(--border-color)", marginBottom: "30px" }}>
          <h3 className="govuk-heading-m">{t("my_profile_title")}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: "10px", marginBottom: "20px" }}>
            <strong>{t("full_name")}:</strong> <span>{user.name}</span>
            <strong>{t("email_address")}:</strong> <span>{user.email}</span>
            <strong>{t("demo_password")}:</strong> <span>{t("citizen")}</span>
          </div>

          <h3 className="govuk-heading-m">{t("demo_password")}</h3>
          {profileSuccess && (
            <div className="govuk-notification-banner" style={{ border: "5px solid var(--govuk-green)" }}>
              <div className="govuk-notification-banner__header" style={{ backgroundColor: "var(--govuk-green)" }}>
                <span className="govuk-notification-banner__title">{t("profile_success_msg")}</span>
              </div>
            </div>
          )}

          <div className="govuk-form-group" style={{ padding: 0, border: "none" }}>
            <label className="govuk-label" htmlFor="profile-pass">
              {t("demo_password")}
            </label>
            <input
              className="govuk-input"
              id="profile-pass"
              type="password"
              value={profilePassword}
              onChange={(e) => setProfilePassword(e.target.value)}
              style={{ maxWidth: "300px" }}
            />
          </div>

          <button className="govuk-button" onClick={() => { setProfileSuccess(true); setTimeout(() => setProfileSuccess(false), 2000); }}>
            {t("save_profile_btn")}
          </button>
        </div>
      </div>
      <CitizenChatbot />
    </>
    );
  }


  // 5. Default: Citizen Dashboard / Overview
  return (
    <>
      <div>
        <h2 className="govuk-heading-xl">{t("dashboard_overview")}</h2>
      <p className="govuk-body">{t("citizen_overview_title")} {user.name}. {t("citizen_overview_sub")}</p>

      {/* Grid Stats */}
      <div className="govuk-grid-row">
        <div className="govuk-card govuk-card--blue">
          <div className="govuk-card-value">{userStats.total}</div>
          <div className="govuk-card-label">{t("stats_total")}</div>
        </div>
        <div className="govuk-card govuk-card--orange">
          <div className="govuk-card-value">{userStats.pending}</div>
          <div className="govuk-card-label">{t("stats_pending")}</div>
        </div>
        <div className="govuk-card govuk-card--green">
          <div className="govuk-card-value">{userStats.resolved}</div>
          <div className="govuk-card-label">{t("stats_resolved")}</div>
        </div>
      </div>

      <h3 className="govuk-heading-l">{t("recent_activity")}</h3>
      {myComplaints.length > 0 ? (
        <div style={{ background: "#ffffff", padding: "20px", border: "1px solid var(--border-color)" }}>
          <p className="govuk-body">{t("ticket")}: <strong>{ticketNo(myComplaints[0].complaintId)}</strong>: "{myComplaints[0].title}".</p>
          <span className="govuk-hint">{t("status_label")}: {t(myComplaints[0].status)} ({t("date_filed")}: {myComplaints[0].createdAt})</span>
          <div style={{ marginTop: "15px" }}>
            <button className="govuk-button govuk-button--secondary" onClick={() => navigate(`#/citizen/complaint/${myComplaints[0].complaintId}`)}>
              {t("view_details")}
            </button>
          </div>
        </div>
      ) : (
        <div className="govuk-notification-banner">
          <div className="govuk-notification-banner__header">
            <span className="govuk-notification-banner__title">{t("all_categories")}</span>
          </div>
          <div className="govuk-notification-banner__content">
            <p className="govuk-body">{t("no_active_complaints")}</p>
            <button className="govuk-button" onClick={() => navigate("#/citizen/new-complaint")}>
              {t("file_new_complaint")}
            </button>
          </div>
        </div>
      )}
    </div>

      {/* Citizen Guidance Chatbot — fixed-position overlay, available on every citizen route */}
      <CitizenChatbot />
    </>
  );

}
