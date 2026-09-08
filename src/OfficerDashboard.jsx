import { useState, useMemo, useContext, useRef } from "react";
import { ticketNo, getSLADeadline, checkSLABreach, ComplaintFilterBar, ComplaintTable } from "./shared";
import { AppContext } from "./AppContext";
import { useRouter, matchRoute } from "./router";

const priorityWeight = { High: 3, Medium: 2, Low: 1 };

export default function OfficerDashboard() {
  const { complaints, addProgressUpdate, user } = useContext(AppContext);
  const { hash, navigate } = useRouter();

  // Detail page state
  const [newStatus, setNewStatus] = useState("In Progress");
  const [remarks, setRemarks] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [proofPhotos, setProofPhotos] = useState([]);
  const [proofError, setProofError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Search in History state
  const [historySearch, setHistorySearch] = useState("");

  // Officer Profile edit
  const [profilePhone, setProfilePhone] = useState(user.phone || "+91 94421 12345");
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Queue filter state
  const [queueSearch, setQueueSearch] = useState("");
  const [queueCategory, setQueueCategory] = useState("All");
  const [queueStatus, setQueueStatus] = useState("All");

  // Complaints assigned to this officer
  const myComplaints = useMemo(() => {
    return complaints.filter((c) => c.assignedOfficer === user.name);
  }, [complaints, user.name]);

  // Department shared queue: complaints in same category that are unassigned
  const sharedQueue = useMemo(() => {
    return complaints.filter((c) => c.category === user.department && !c.assignedOfficer);
  }, [complaints, user.department]);

  // Work Queue: Assigned or In Progress
  const workQueue = useMemo(() => {
    return myComplaints
      .filter((c) => ["Assigned", "In Progress"].includes(c.status))
      .sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);
  }, [myComplaints]);

  // Completed / Closed History
  const completedHistory = useMemo(() => {
    return myComplaints
      .filter((c) => ["Completed", "Closed"].includes(c.status))
      .filter((c) => {
        const query = historySearch.toLowerCase();
        return !query ||
          c.title.toLowerCase().includes(query) ||
          c.description.toLowerCase().includes(query) ||
          ticketNo(c.complaintId).toLowerCase().includes(query);
      });
  }, [myComplaints, historySearch]);

  // Stats
  const officerStats = useMemo(() => {
    const pending = myComplaints.filter((c) => c.status === "Assigned").length;
    const active = myComplaints.filter((c) => c.status === "In Progress").length;
    const completed = myComplaints.filter((c) => ["Completed", "Closed"].includes(c.status)).length;
    return { pending, active, completed };
  }, [myComplaints]);

  const processProofFile = (file) => {
    setProofError("");
    if (!file) return;

    if (proofPhotos.length >= 3) {
      setProofError("You can upload a maximum of 3 proof photos.");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setProofError("The selected file must be an image (JPG, PNG, or WebP).");
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setProofError("Each proof photo must be smaller than 5 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProofPhotos((prev) => {
        if (prev.length >= 3) return prev;
        return [...prev, reader.result];
      });
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
      Array.from(e.dataTransfer.files).forEach(processProofFile);
    }
  };

  const handleUpdateProgress = (complaintId, e) => {
    e.preventDefault();
    if (!remarks.trim()) {
      alert("Please enter progress remarks.");
      return;
    }

    setIsUpdating(true);
    setTimeout(() => {
      addProgressUpdate(complaintId, newStatus, remarks.trim(), proofPhotos);
      setRemarks("");
      setProofPhotos([]);
      setIsUpdating(false);
    }, 800);
  };

  // Routing
  const matchDetail = matchRoute("/officer/complaint/:id", hash);

  // 1. Complaint Detail Page
  if (matchDetail.matches) {
    const cId = parseInt(matchDetail.params.id, 10);
    // Strict department & assignment data boundary check
    const complaint = complaints.find(
      (c) => c.complaintId === cId && (c.assignedOfficer === user.name || c.category === user.department)
    );

    if (!complaint) {
      return (
        <div>
          <a onClick={() => navigate("#/officer/queue")} className="govuk-body" style={{ textDecoration: "underline", color: "var(--govuk-blue)", cursor: "pointer", display: "inline-block", marginBottom: "20px", fontWeight: "600" }}>
            ← Back to work queue
          </a>
          <h2 className="govuk-heading-l">Access Denied / Task Not Found</h2>
          <p className="govuk-body">You do not have permission to view this complaint, or it is assigned to another department/officer.</p>
          <button className="govuk-button govuk-button--secondary" onClick={() => navigate("#/officer/queue")}>
            Back to Queue
          </button>
        </div>
      );
    }

    const isAssignedToMe = complaint.assignedOfficer === user.name;
    const deadline = getSLADeadline(complaint.createdAt, complaint.category, complaint.priority);
    const isBreached = checkSLABreach(complaint.createdAt, complaint.category, complaint.priority, complaint.status, complaint.completionDate);

    // Calculate time offset label
    const msDiff = new Date(deadline) - new Date();
    const hoursRemaining = Math.round(msDiff / (1000 * 60 * 60));
    const slaStatusText = isBreached
      ? "SLA BREACHED"
      : `${hoursRemaining > 0 ? hoursRemaining : 0} hours remaining`;

    return (
      <div>
        <a onClick={() => navigate("#/officer/queue")} className="govuk-body" style={{ textDecoration: "underline", color: "var(--govuk-blue)", cursor: "pointer", display: "inline-block", marginBottom: "20px", fontWeight: "600" }}>
          ← Back to work queue
        </a>
        <h2 className="govuk-heading-xl">Complaint Task: {ticketNo(complaint.complaintId)}</h2>

        <div style={{ background: "#ffffff", padding: "30px", border: "1px solid var(--border-color)", marginBottom: "30px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "15px", marginBottom: "20px" }}>
            <div>
              <span className="govuk-hint">Category</span>
              <p className="govuk-body" style={{ fontWeight: "700" }}>{complaint.category}</p>
            </div>
            <div>
              <span className="govuk-hint">Citizen Profile</span>
              <p className="govuk-body" style={{ fontWeight: "700" }}>{complaint.citizenName} ({complaint.citizenEmail})</p>
            </div>
            <div>
              <span className="govuk-hint">Priority / Severity</span>
              <p className="govuk-body" style={{ fontWeight: "700", color: complaint.priority === "High" ? "var(--govuk-red)" : "inherit" }}>
                {complaint.priority}
              </p>
            </div>
            <div>
              <span className="govuk-hint">Status</span>
              <div>
                <span className={`govuk-tag ${
                  complaint.status === "Completed" ? "govuk-tag--green" :
                  complaint.status === "In Progress" ? "govuk-tag--orange" :
                  complaint.status === "Withdrawn" ? "govuk-tag--grey" : "govuk-tag--purple"
                }`}>
                  {complaint.status}
                </span>
              </div>
            </div>
          </div>

          <div style={{ borderTop: "1px solid #ccc", paddingTop: "15px", display: "flex", gap: "25px", flexWrap: "wrap" }}>
            <div>
              <span className="govuk-hint">SLA Target Date</span>
              <p className="govuk-body" style={{ fontWeight: "700" }}>{deadline}</p>
            </div>
            <div>
              <span className="govuk-hint">SLA Countdown Status</span>
              <p className="govuk-body" style={{ fontWeight: "700", color: isBreached ? "var(--govuk-red)" : "var(--govuk-green)" }}>
                {slaStatusText}
              </p>
            </div>
          </div>

          <h3 className="govuk-heading-m" style={{ marginTop: "20px" }}>{complaint.title}</h3>
          <p className="govuk-body">{complaint.description}</p>
          <span className="govuk-hint">Location: {complaint.location} | Registered: {complaint.createdAt}</span>

          {complaint.photo && (
            <div style={{ margin: "20px 0" }}>
              <h4 className="govuk-heading-m" style={{ fontSize: "16px" }}>Evidence photograph(s)</h4>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {Array.isArray(complaint.photo) ? (
                  complaint.photo.map((p, idx) => (
                    <img key={idx} src={p} style={{ maxWidth: "200px", maxHeight: "200px", border: "2px solid var(--govuk-black)" }} alt={`Evidence ${idx + 1}`} />
                  ))
                ) : (
                  <img src={complaint.photo} style={{ maxWidth: "100%", maxHeight: "300px", border: "2px solid var(--govuk-black)" }} alt="Evidence" />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Form - Hide if complaint is already resolved, closed or withdrawn, or NOT assigned to this officer */}
        {["Assigned", "In Progress"].includes(complaint.status) && isAssignedToMe ? (
          <div style={{ background: "#ffffff", padding: "30px", border: "3px solid var(--govuk-black)", marginBottom: "30px", position: "relative" }}>
            {isUpdating && (
              <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(255,255,255,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 10 }}>
                <div style={{ border: "4px solid #f3f3f3", borderTop: "4px solid var(--govuk-blue)", borderRadius: "50%", width: "30px", height: "30px", animation: "spin 1s linear infinite" }}></div>
              </div>
            )}
            <h3 className="govuk-heading-m">Post Progress Update</h3>
            <form onSubmit={(e) => handleUpdateProgress(complaint.complaintId, e)}>
              <div className="govuk-form-group" style={{ padding: 0, border: "none" }}>
                <label className="govuk-label" htmlFor="status-select">Select Next Status</label>
                <select className="govuk-select" id="status-select" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                  {complaint.status === "Assigned" && (
                    <option value="In Progress">In Progress (Active Work)</option>
                  )}
                  <option value="Completed">Completed (Resolution Fixed)</option>
                </select>
              </div>

              <div className="govuk-form-group" style={{ padding: 0, border: "none" }}>
                <label className="govuk-label" htmlFor="remarks">Action Remarks</label>
                <span className="govuk-hint">Provide details of work done, material repairs, or inspect comments (mandatory)</span>
                <input
                  className="govuk-input"
                  id="remarks"
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Cleared sewage line blocks at Main street corner."
                  required
                />
              </div>

              {/* Resolution proof upload */}
              <div className="govuk-form-group" style={{ padding: 0, border: "none" }}>
                <label className="govuk-label">Proof Photograph (Optional)</label>
                <span className="govuk-hint">Attach a photo demonstrating completed work or current status</span>

                <div
                  className={`govuk-file-upload-box ${dragActive ? "drag-active" : ""}`}
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{ marginTop: "10px" }}
                >
                  <span style={{ fontSize: "28px" }}>📸</span>
                  <p className="govuk-body" style={{ margin: "5px 0" }}>
                    {dragActive ? "Drop the proof image here..." : "Drag & drop an image, or click to choose file"}
                  </p>
                  <span className="govuk-hint">PNG, JPG, or WebP (Up to 3 photos, max 5MB each)</span>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={(e) => {
                      if (e.target.files) {
                        Array.from(e.target.files).forEach(processProofFile);
                      }
                    }}
                    style={{ display: "none" }}
                  />
                </div>

                {proofError && (
                  <span className="govuk-error-message" style={{ marginTop: "8px", display: "block" }}>
                    <span className="govuk-visually-hidden">Error:</span> {proofError}
                  </span>
                )}

                {proofPhotos.length > 0 && (
                  <div style={{ marginTop: "15px" }}>
                    <p className="govuk-body" style={{ fontWeight: "700" }}>Proof Photos Attached ({proofPhotos.length}/3)</p>
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      {proofPhotos.map((p, idx) => (
                        <div key={idx} className="govuk-file-upload-preview" style={{ margin: 0, position: "relative" }}>
                          <img src={p} style={{ width: "80px", height: "80px", objectFit: "cover" }} alt={`Proof ${idx + 1}`} />
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
                            onClick={() => setProofPhotos((prev) => prev.filter((_, i) => i !== idx))}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button type="submit" className="govuk-button">
                Submit Progress Update
              </button>
            </form>
          </div>
        ) : !isAssignedToMe ? (
          <div style={{ background: "#f1f1f1", padding: "20px", border: "1px solid #ccc", marginBottom: "30px" }}>
            <p className="govuk-body" style={{ margin: 0 }}>This complaint belongs to your department's shared queue, but you cannot post progress updates until the Administrator assigns it to your profile.</p>
          </div>
        ) : null}

        <h3 className="govuk-heading-l">Timeline Log History</h3>
        <div className="govuk-timeline">
          {complaint.progressLog.map((log, index) => (
            <div key={index} className="govuk-timeline__item">
              <span className="govuk-timeline__date">{log.date}</span>
              <h4 className="govuk-timeline__title">{log.status} <span className="govuk-hint" style={{ fontSize: "14px" }}>by {log.actor || "System"} ({log.role || "system"})</span></h4>
              <p className="govuk-timeline__desc">{log.remarks}</p>
              {log.photos && log.photos.length > 0 && (
                <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                  {log.photos.map((p, pIdx) => (
                    <img key={pIdx} src={p} style={{ maxWidth: "100px", maxHeight: "100px", border: "1px solid #000" }} alt={`Proof ${pIdx + 1}`} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 2. My Work Queue Page
  if (hash.includes("/officer/queue")) {
    // SLA extra column renderer
    const slaExtraCol = [{
      header: "SLA Deadline",
      render: (c) => {
        const deadline = getSLADeadline(c.createdAt, c.category, c.priority);
        const isBreached = checkSLABreach(c.createdAt, c.category, c.priority, c.status, c.completionDate);
        return (
          <span style={{ fontWeight: "700", color: isBreached ? "var(--govuk-red)" : "var(--govuk-green)" }}>
            {deadline}{isBreached ? " (BREACHED)" : ""}
          </span>
        );
      }
    }];

    // Apply queue filters
    const filteredQueue = workQueue.filter((c) => {
      const catOk = queueCategory === "All" || c.category === queueCategory;
      const statusOk = queueStatus === "All" || c.status === queueStatus;
      const q = queueSearch.trim().toLowerCase();
      const searchOk = !q || c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        ticketNo(c.complaintId).toLowerCase().includes(q);
      return catOk && statusOk && searchOk;
    });

    return (
      <div>
        <a onClick={() => navigate("#/officer/overview")} className="govuk-body" style={{ textDecoration: "underline", color: "var(--govuk-blue)", cursor: "pointer", display: "inline-block", marginBottom: "20px", fontWeight: "600" }}>
          ← Back to dashboard overview
        </a>
        <h2 className="govuk-heading-xl">Assigned Work Queue</h2>
        <p className="govuk-body">Below are your active work assignments, sorted by estimated priority. SLA warnings will display if a task is close to or has breached target times.</p>

        <ComplaintFilterBar
          searchQuery={queueSearch}
          onSearchChange={setQueueSearch}
          filterCategory={queueCategory}
          onCategoryChange={setQueueCategory}
          categories={[...new Set(workQueue.map(c => c.category))]}
          filterStatus={queueStatus}
          onStatusChange={setQueueStatus}
          searchPlaceholder="Search by ticket ID or title..."
          searchLabel="Search Queue"
        />

        <ComplaintTable
          complaints={filteredQueue}
          extraColumns={slaExtraCol}
          emptyMessage="No active complaints in queue."
          onAction={(c) => navigate(`#/officer/complaint/${c.complaintId}`)}
          actionLabel="Update Task"
          actionClassName="govuk-button"
        />

        {/* Shared queue section */}
        <h3 className="govuk-heading-l" style={{ marginTop: "40px" }}>Department Shared Queue ({user.department})</h3>
        <p className="govuk-body">Unassigned complaints registered in your department. These require Admin allocation before they can be resolved by you.</p>

        <ComplaintTable
          complaints={sharedQueue}
          emptyMessage="No unassigned complaints in shared department queue."
          onAction={(c) => navigate(`#/officer/complaint/${c.complaintId}`)}
          actionLabel="View Record"
        />
      </div>
    );
  }

  // 3. Completed History Page
  if (hash.includes("/officer/completed")) {
    return (
      <div>
        <a onClick={() => navigate("#/officer/overview")} className="govuk-body" style={{ textDecoration: "underline", color: "var(--govuk-blue)", cursor: "pointer", display: "inline-block", marginBottom: "20px", fontWeight: "600" }}>
          ← Back to dashboard overview
        </a>
        <h2 className="govuk-heading-xl">Completed Resolutions History</h2>
        <p className="govuk-body">Archive of complaints successfully solved or closed by you.</p>

        <ComplaintFilterBar
          searchQuery={historySearch}
          onSearchChange={setHistorySearch}
          filterCategory={queueCategory}
          onCategoryChange={setQueueCategory}
          categories={[...new Set(completedHistory.map(c => c.category))]}
          filterStatus={queueStatus}
          onStatusChange={setQueueStatus}
          searchPlaceholder="Search by ID or keywords..."
          searchLabel="Search Completed Archive"
        />

        <ComplaintTable
          complaints={completedHistory.filter((c) => {
            const catOk = queueCategory === "All" || c.category === queueCategory;
            const statusOk = queueStatus === "All" || c.status === queueStatus;
            return catOk && statusOk;
          })}
          emptyMessage="No completed complaints found."
          onAction={(c) => navigate(`#/officer/complaint/${c.complaintId}`)}
          actionLabel="View Record"
        />
      </div>
    );
  }

  // 4. Officer Profile Page
  if (hash.includes("/officer/profile")) {
    return (
      <div>
        <a onClick={() => navigate("#/officer/overview")} className="govuk-body" style={{ textDecoration: "underline", color: "var(--govuk-blue)", cursor: "pointer", display: "inline-block", marginBottom: "20px", fontWeight: "600" }}>
          ← Back to dashboard overview
        </a>
        <h2 className="govuk-heading-xl">Officer Profile</h2>
        <p className="govuk-body">Your official workspace and details.</p>

        <div style={{ background: "#ffffff", padding: "30px", border: "1px solid var(--border-color)", marginBottom: "30px" }}>
          <h3 className="govuk-heading-m">Official Details</h3>
          <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: "10px", marginBottom: "20px" }}>
            <strong>Full Name:</strong> <span>{user.name}</span>
            <strong>Email:</strong> <span>{user.email}</span>
            <strong>Role:</strong> <span>Department Action Officer</span>
            <strong>Assigned Dept:</strong> <span>{user.department}</span>
            <strong>Designation:</strong> <span>{user.designation}</span>
          </div>

          <h3 className="govuk-heading-m">Contact Details Update</h3>
          {profileSuccess && (
            <div className="govuk-notification-banner" style={{ border: "5px solid var(--govuk-green)" }}>
              <div className="govuk-notification-banner__header" style={{ backgroundColor: "var(--govuk-green)" }}>
                <span className="govuk-notification-banner__title">Success</span>
              </div>
              <div className="govuk-notification-banner__content">
                <p className="govuk-body" style={{ fontWeight: "700" }}>Contact details updated successfully.</p>
              </div>
            </div>
          )}

          <div className="govuk-form-group" style={{ padding: 0, border: "none" }}>
            <label className="govuk-label" htmlFor="phone">Official Mobile Phone</label>
            <input
              className="govuk-input"
              id="phone"
              type="text"
              value={profilePhone}
              onChange={(e) => setProfilePhone(e.target.value)}
              style={{ maxWidth: "300px" }}
            />
          </div>

          <button className="govuk-button" onClick={() => { setProfileSuccess(true); setTimeout(() => setProfileSuccess(false), 2000); }}>
            Save Contact Details
          </button>
        </div>
      </div>
    );
  }

  // 5. Default Dashboard / Overview Page
  return (
    <div>
      <h2 className="govuk-heading-xl">Officer Workspace</h2>
      <p className="govuk-body">Signed in as: <strong>{user.name}</strong></p>

      <div className="govuk-grid-row">
        <div className="govuk-card govuk-card--purple">
          <div className="govuk-card-value">{officerStats.pending}</div>
          <div className="govuk-card-label">Pending Action</div>
        </div>
        <div className="govuk-card govuk-card--orange">
          <div className="govuk-card-value">{officerStats.active}</div>
          <div className="govuk-card-label">In Progress</div>
        </div>
        <div className="govuk-card govuk-card--green">
          <div className="govuk-card-value">{officerStats.completed}</div>
          <div className="govuk-card-label">My Resolutions</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
        <div style={{ background: "#ffffff", padding: "30px", border: "1px solid var(--border-color)", display: "flex", flexDirection: "column", minHeight: "220px" }}>
          <h3 className="govuk-heading-m">Assigned Work Queue</h3>
          <p className="govuk-body" style={{ flex: 1 }}>
            {workQueue.length > 0 ? (
              <>You have <strong>{workQueue.length}</strong> active task assignments.</>
            ) : (
              "No pending assignments. All caught up!"
            )}
          </p>
          <div style={{ marginTop: "auto", paddingTop: "15px" }}>
            <button className="govuk-button" onClick={() => navigate("#/officer/queue")} style={{ marginBottom: 0 }}>
              Access Queue
            </button>
          </div>
        </div>

        <div style={{ background: "#ffffff", padding: "30px", border: "1px solid var(--border-color)", display: "flex", flexDirection: "column", minHeight: "220px" }}>
          <h3 className="govuk-heading-m">Shared Department Queue ({user.department})</h3>
          <p className="govuk-body" style={{ flex: 1 }}>
            There are <strong>{sharedQueue.length}</strong> unassigned tasks in your department.
          </p>
          <div style={{ marginTop: "auto", paddingTop: "15px" }}>
            <button className="govuk-button govuk-button--secondary" onClick={() => navigate("#/officer/queue")} style={{ marginBottom: 0 }}>
              View Shared Queue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
