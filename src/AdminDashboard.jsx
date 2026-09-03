import { useMemo, useState, useContext } from "react";
import { STATUSES, ticketNo } from "./shared";
import { AppContext } from "./AppContext";
import { useRouter, matchRoute } from "./router";

export default function AdminDashboard() {
  const {
    complaints,
    officers,
    categories,
    assignOfficer,
    updateStatus,
    addOfficer,
    deleteOfficer,
    deleteComplaint,
    addCategory,
    editCategory,
    submitComplaint,
    user
  } = useContext(AppContext);

  const { hash, navigate } = useRouter();

  // Sub-page states
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  
  // Register officer fields
  const [newOfficerName, setNewOfficerName] = useState("");
  const [newOfficerEmail, setNewOfficerEmail] = useState("");
  const [newOfficerPhone, setNewOfficerPhone] = useState("");
  const [newOfficerDesignation, setNewOfficerDesignation] = useState("");
  const [newOfficerDept, setNewOfficerDept] = useState(categories[0] || "");

  // Status override states
  const [selectedOverrideStatus, setSelectedOverrideStatus] = useState("");
  const [overrideRemarksText, setOverrideRemarksText] = useState("");

  // Admin filing on behalf of citizen states
  const [behalfEmail, setBehalfEmail] = useState("");
  const [behalfName, setBehalfName] = useState("");
  const [behalfTitle, setBehalfTitle] = useState("");
  const [behalfDescription, setBehalfDescription] = useState("");
  const [behalfCategory, setBehalfCategory] = useState(categories[0] || "");
  const [behalfLocation, setBehalfLocation] = useState("");
  const [behalfPriority, setBehalfPriority] = useState("Medium");
  const [behalfSuccess, setBehalfSuccess] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [visibleCount, setVisibleCount] = useState(10);
  const [updatingTicketId, setUpdatingTicketId] = useState(null);

  // Manage Categories states
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCatName, setEditingCatName] = useState("");
  const [editedCatName, setEditedCatName] = useState("");

  // Calculate system-wide stats
  const stats = useMemo(() => {
    const byStatus = {};
    STATUSES.forEach((s) => (byStatus[s] = 0));
    complaints.forEach((c) => {
      byStatus[c.status] = (byStatus[c.status] || 0) + 1;
    });
    return {
      total: complaints.length,
      byStatus,
    };
  }, [complaints]);

  // Calculate category breakdown
  const categoryStats = useMemo(() => {
    const counts = {};
    categories.forEach((cat) => (counts[cat] = 0));
    complaints.forEach((c) => {
      if (counts[c.category] !== undefined) {
        counts[c.category] += 1;
      }
    });
    return counts;
  }, [complaints, categories]);

  // Calculate officer active workloads
  const officerWorkloads = useMemo(() => {
    const workloads = {};
    officers.forEach((o) => (workloads[o] = 0));
    complaints.forEach((c) => {
      if (c.assignedOfficer && ["Assigned", "In Progress"].includes(c.status)) {
        workloads[c.assignedOfficer] = (workloads[c.assignedOfficer] || 0) + 1;
      }
    });
    return workloads;
  }, [complaints, officers]);

  // Processed complaints for archive list
  const processedComplaints = useMemo(() => {
    let list = complaints.filter((c) => {
      const categoryOk = filterCategory === "All" || c.category === filterCategory;
      const statusOk = filterStatus === "All" || c.status === filterStatus;
      
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        c.title.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query) ||
        c.citizenName.toLowerCase().includes(query) ||
        c.location.toLowerCase().includes(query) ||
        ticketNo(c.complaintId).toLowerCase().includes(query);

      return categoryOk && statusOk && matchesSearch;
    });

    if (sortBy === "newest") {
      list.sort((a, b) => b.complaintId - a.complaintId);
    } else if (sortBy === "priority") {
      const weight = { High: 3, Medium: 2, Low: 1 };
      list.sort((a, b) => weight[b.priority] - weight[a.priority]);
    } else if (sortBy === "status") {
      const order = { "Submitted": 1, "Assigned": 2, "In Progress": 3, "Completed": 4, "Closed": 5 };
      list.sort((a, b) => order[a.status] - order[b.status]);
    }

    return list;
  }, [complaints, filterCategory, filterStatus, searchQuery, sortBy]);

  const paginatedComplaints = useMemo(() => {
    return processedComplaints.slice(0, visibleCount);
  }, [processedComplaints, visibleCount]);

  const handleAddOfficerSubmit = (e) => {
    e.preventDefault();
    if (!newOfficerName.trim() || !newOfficerEmail.trim() || !newOfficerPhone.trim() || !newOfficerDesignation.trim()) {
      alert("All officer profile fields are mandatory.");
      return;
    }
    addOfficer({
      name: newOfficerName.trim(),
      email: newOfficerEmail.trim(),
      phone: newOfficerPhone.trim(),
      designation: newOfficerDesignation.trim(),
      department: newOfficerDept,
      password: "1234"
    });
    setNewOfficerName("");
    setNewOfficerEmail("");
    setNewOfficerPhone("");
    setNewOfficerDesignation("");
  };

  const handleAddCategorySubmit = (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    addCategory(newCategoryName.trim());
    setNewCategoryName("");
  };

  const handleEditCategorySubmit = (e, oldCat) => {
    e.preventDefault();
    if (!editedCatName.trim()) return;
    editCategory(oldCat, editedCatName.trim());
    setEditingCatName("");
    setEditedCatName("");
  };

  const handleAssignChange = (complaintId, officerName) => {
    setUpdatingTicketId(complaintId);
    setTimeout(() => {
      assignOfficer(complaintId, officerName);
      setUpdatingTicketId(null);
    }, 600);
  };

  const handleStatusOverride = (complaintId, newStatus, remarks) => {
    setUpdatingTicketId(complaintId);
    setTimeout(() => {
      updateStatus(complaintId, newStatus, remarks);
      setUpdatingTicketId(null);
    }, 600);
  };

  const matchDetail = matchRoute("/admin/complaint/:id", hash);

  // 1. Complaint Detail Page
  if (matchDetail.matches) {
    const cId = parseInt(matchDetail.params.id, 10);
    const complaint = complaints.find((c) => c.complaintId === cId);

    if (!complaint) {
      return (
        <div>
          <h2 className="govuk-heading-l">Complaint Record Not Found</h2>
          <button className="govuk-button govuk-button--secondary" onClick={() => navigate("#/admin/complaints")}>
            Back to archive
          </button>
        </div>
      );
    }

    return (
      <div>
        <a onClick={() => navigate("#/admin/complaints")} className="govuk-body" style={{ textDecoration: "underline", color: "var(--govuk-blue)", cursor: "pointer", display: "inline-block", marginBottom: "20px" }}>
          ← Back to complaints list
        </a>
        <h2 className="govuk-heading-xl">Grievance Oversight: {ticketNo(complaint.complaintId)}</h2>

        <div style={{ background: "#ffffff", padding: "30px", border: "1px solid var(--border-color)", marginBottom: "30px", position: "relative" }}>
          {updatingTicketId === complaint.complaintId && (
            <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(255,255,255,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 10 }}>
              <div style={{ border: "4px solid #f3f3f3", borderTop: "4px solid var(--govuk-blue)", borderRadius: "50%", width: "35px", height: "35px", animation: "spin 1s linear infinite" }}></div>
            </div>
          )}

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
              <span className="govuk-hint">Priority</span>
              <p className="govuk-body" style={{ fontWeight: "700", color: complaint.priority === "High" ? "var(--govuk-red)" : "inherit" }}>
                {complaint.priority}
              </p>
            </div>
            <div>
              <span className="govuk-hint">Current Status</span>
              <div>
                <span className={`govuk-tag ${
                  complaint.status === "Completed" ? "govuk-tag--green" :
                  complaint.status === "In Progress" ? "govuk-tag--orange" :
                  complaint.status === "Assigned" ? "govuk-tag--purple" : "govuk-tag--blue"
                }`}>
                  {complaint.status}
                </span>
              </div>
            </div>
          </div>

          <h3 className="govuk-heading-m">{complaint.title}</h3>
          <p className="govuk-body">{complaint.description}</p>
          <span className="govuk-hint">Location: {complaint.location} | Registered: {complaint.createdAt}</span>

          {complaint.photo && (
            <div style={{ margin: "20px 0" }}>
              <h4 className="govuk-heading-m" style={{ fontSize: "16px" }}>Evidence attachment</h4>
              <img src={complaint.photo} style={{ maxWidth: "100%", maxHeight: "300px", border: "2px solid var(--govuk-black)" }} alt="Evidence" />
            </div>
          )}

          {/* Admin Control Actions */}
          <div style={{ marginTop: "30px", borderTop: "2px solid var(--govuk-black)", paddingTop: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
              <div className="govuk-form-group" style={{ flex: 1, minWidth: "200px", padding: 0, border: "none", marginBottom: 0 }}>
                <label className="govuk-label" style={{ fontSize: "16px" }} htmlFor="officer-select">Assign / Reassign Officer (Dept: {complaint.category})</label>
                <select
                  className="govuk-select"
                  id="officer-select"
                  value={complaint.assignedOfficer || ""}
                  onChange={(e) => handleAssignChange(complaint.complaintId, e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {officers.filter(o => o.department === complaint.category).map((o) => (
                    <option key={o.name} value={o.name}>{o.name} ({o.designation})</option>
                  ))}
                </select>
              </div>

              <div className="govuk-form-group" style={{ flex: 1, minWidth: "200px", padding: 0, border: "none", marginBottom: 0 }}>
                <label className="govuk-label" style={{ fontSize: "16px" }} htmlFor="override-status">Override Status State</label>
                <select
                  className="govuk-select"
                  id="override-status"
                  value={selectedOverrideStatus || complaint.status}
                  onChange={(e) => setSelectedOverrideStatus(e.target.value)}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", alignItems: "flex-end" }}>
              <div className="govuk-form-group" style={{ flex: 2, minWidth: "300px", padding: 0, border: "none", marginBottom: 0 }}>
                <label className="govuk-label" style={{ fontSize: "16px" }} htmlFor="override-remarks">Override Reason/Remarks (Mandatory)</label>
                <input
                  className="govuk-input"
                  id="override-remarks"
                  type="text"
                  placeholder="Explain why the status is being manually overridden..."
                  value={overrideRemarksText}
                  onChange={(e) => setOverrideRemarksText(e.target.value)}
                />
              </div>
              <button
                type="button"
                className="govuk-button"
                style={{ marginBottom: 0 }}
                onClick={() => {
                  if (!overrideRemarksText.trim()) {
                    alert("A reason is required to override the status.");
                    return;
                  }
                  handleStatusOverride(complaint.complaintId, selectedOverrideStatus || complaint.status, overrideRemarksText.trim());
                  setOverrideRemarksText("");
                  setSelectedOverrideStatus("");
                }}
              >
                Apply Override
              </button>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
              <button
                type="button"
                className="govuk-button govuk-button--warning"
                onClick={() => {
                  if (window.confirm(`Delete record ${ticketNo(complaint.complaintId)} permanently?`)) {
                    deleteComplaint(complaint.complaintId);
                    navigate("#/admin/complaints");
                  }
                }}
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>

        <h3 className="govuk-heading-l">Timeline Log History</h3>
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
    );
  }

  // 2. All Complaints Page
  if (hash.includes("/admin/complaints")) {
    return (
      <div>
        <h2 className="govuk-heading-xl">Grievance Registry Records</h2>
        <p className="govuk-body">Manage municipal workloads, status updates, and assign action officers.</p>

        {/* Filter / Search panel */}
        <div style={{ background: "#ffffff", padding: "20px", border: "1px solid var(--border-color)", marginBottom: "30px" }}>
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            <div style={{ flex: "2 1 300px" }}>
              <label className="govuk-label" style={{ fontSize: "16px" }} htmlFor="search">Search Archive</label>
              <input
                className="govuk-input"
                id="search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ID, Title, Citizen, Location..."
              />
            </div>
            <div>
              <label className="govuk-label" style={{ fontSize: "16px" }} htmlFor="category">Category</label>
              <select className="govuk-select" id="category" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                <option value="All">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="govuk-label" style={{ fontSize: "16px" }} htmlFor="status">Status</label>
              <select className="govuk-select" id="status" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="All">All Statuses</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="govuk-label" style={{ fontSize: "16px" }} htmlFor="sort">Sort By</label>
              <select className="govuk-select" id="sort" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="newest">Newest</option>
                <option value="priority">Highest Severity</option>
                <option value="status">Status Order</option>
              </select>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <button
                type="button"
                className="govuk-button govuk-button--warning"
                style={{ marginBottom: 0 }}
                onClick={() => {
                  const completedTickets = complaints.filter((c) => c.status === "Completed");
                  if (completedTickets.length === 0) {
                    alert("No Completed tickets are available to close.");
                    return;
                  }
                  if (window.confirm(`Mass-Action Confirmation: Are you sure you want to close all ${completedTickets.length} completed tickets? This will write distinct audit logs for each ticket.`)) {
                    completedTickets.forEach((c) => {
                      updateStatus(c.complaintId, "Closed", "Mass-closed via Admin bulk close tool.");
                    });
                    alert(`Mass-action completed. Closed ${completedTickets.length} tickets.`);
                  }
                }}
              >
                Bulk Close Completed
              </button>
            </div>
          </div>
        </div>

        <table className="govuk-table">
          <thead>
            <tr>
              <th className="govuk-table__header">Ticket ID</th>
              <th className="govuk-table__header">Title</th>
              <th className="govuk-table__header">Category</th>
              <th className="govuk-table__header">Priority</th>
              <th className="govuk-table__header">Assigned Officer</th>
              <th className="govuk-table__header">Status</th>
              <th className="govuk-table__header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedComplaints.map((c) => (
              <tr className="govuk-table__row" key={c.complaintId}>
                <td className="govuk-table__cell" style={{ fontWeight: "700" }}>{ticketNo(c.complaintId)}</td>
                <td className="govuk-table__cell">{c.title}</td>
                <td className="govuk-table__cell">{c.category}</td>
                <td className="govuk-table__cell">{c.priority}</td>
                <td className="govuk-table__cell" style={{ color: c.assignedOfficer ? "inherit" : "var(--text-secondary)" }}>
                  {c.assignedOfficer || "Unassigned"}
                </td>
                <td className="govuk-table__cell">
                  <span className={`govuk-tag ${
                    c.status === "Completed" ? "govuk-tag--green" :
                    c.status === "In Progress" ? "govuk-tag--orange" :
                    c.status === "Assigned" ? "govuk-tag--purple" : "govuk-tag--blue"
                  }`}>
                    {c.status}
                  </span>
                </td>
                <td className="govuk-table__cell">
                  <button className="govuk-button govuk-button--secondary" style={{ padding: "4px 8px", fontSize: "14px" }} onClick={() => navigate(`#/admin/complaint/${c.complaintId}`)}>
                    View & Action
                  </button>
                </td>
              </tr>
            ))}
            {paginatedComplaints.length === 0 && (
              <tr>
                <td className="govuk-table__cell" colSpan={7} style={{ textAlign: "center" }}>
                  No complaints found.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {processedComplaints.length > visibleCount && (
          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <button className="govuk-button govuk-button--secondary" onClick={() => setVisibleCount((prev) => prev + 10)}>
              Load More Records
            </button>
          </div>
        )}
      </div>
    );
  }

  // 2.5 File Complaint On Behalf Page
  if (hash.includes("/admin/new-complaint")) {
    const handleSubmitBehalf = (e) => {
      e.preventDefault();
      if (!behalfEmail.trim() || !behalfTitle.trim() || !behalfDescription.trim() || !behalfLocation.trim()) {
        alert("All fields are required.");
        return;
      }
      submitComplaint({
        title: behalfTitle.trim(),
        description: behalfDescription.trim(),
        category: behalfCategory,
        location: behalfLocation.trim(),
        priority: behalfPriority,
        filedByAdmin: true,
        citizenEmail: behalfEmail.trim(),
        citizenName: behalfName.trim() || "Registered Citizen"
      });
      setBehalfSuccess(`Successfully registered complaint on behalf of ${behalfEmail}`);
      setBehalfEmail("");
      setBehalfName("");
      setBehalfTitle("");
      setBehalfDescription("");
      setBehalfLocation("");
      setTimeout(() => setBehalfSuccess(""), 4000);
    };

    return (
      <div>
        <h2 className="govuk-heading-xl">Register Grievance (On Behalf of Citizen)</h2>
        <p className="govuk-body">Register a new municipal complaint on behalf of a citizen who has reported an issue via phone or in-person walk-in. The record will be clearly logged as filed by the Administrator.</p>

        {behalfSuccess && (
          <div className="govuk-notification-banner" style={{ border: "5px solid var(--govuk-green)", marginBottom: "20px" }}>
            <div className="govuk-notification-banner__header" style={{ backgroundColor: "var(--govuk-green)" }}>
              <span className="govuk-notification-banner__title">Success</span>
            </div>
            <div className="govuk-notification-banner__content">
              <p className="govuk-body" style={{ fontWeight: "700" }}>{behalfSuccess}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmitBehalf} style={{ background: "#ffffff", padding: "30px", border: "1px solid var(--border-color)" }}>
          <div className="govuk-form-group">
            <label className="govuk-label" htmlFor="behalf-email">Citizen Email Address (Required)</label>
            <span className="govuk-hint">The email of the citizen. The complaint will be linked to this account.</span>
            <input
              className="govuk-input"
              id="behalf-email"
              type="email"
              value={behalfEmail}
              onChange={(e) => setBehalfEmail(e.target.value)}
              placeholder="citizen@example.com"
              required
            />
          </div>

          <div className="govuk-form-group">
            <label className="govuk-label" htmlFor="behalf-name">Citizen Full Name (Optional)</label>
            <input
              className="govuk-input"
              id="behalf-name"
              type="text"
              value={behalfName}
              onChange={(e) => setBehalfName(e.target.value)}
              placeholder="e.g. Jane Doe"
            />
          </div>

          <div className="govuk-form-group">
            <label className="govuk-label" htmlFor="behalf-title">Complaint Title</label>
            <input
              className="govuk-input"
              id="behalf-title"
              type="text"
              value={behalfTitle}
              onChange={(e) => setBehalfTitle(e.target.value)}
              placeholder="e.g. Potholes near Main Road"
              required
            />
          </div>

          <div className="govuk-form-group">
            <label className="govuk-label" htmlFor="behalf-desc">Detailed Description</label>
            <textarea
              className="govuk-input"
              id="behalf-desc"
              value={behalfDescription}
              onChange={(e) => setBehalfDescription(e.target.value)}
              style={{ minHeight: "120px" }}
              required
            />
          </div>

          <div className="govuk-form-group">
            <label className="govuk-label" htmlFor="behalf-cat">Category</label>
            <select
              className="govuk-select"
              id="behalf-cat"
              value={behalfCategory}
              onChange={(e) => setBehalfCategory(e.target.value)}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="govuk-form-group">
            <label className="govuk-label" htmlFor="behalf-prio">Priority</label>
            <select
              className="govuk-select"
              id="behalf-prio"
              value={behalfPriority}
              onChange={(e) => setBehalfPriority(e.target.value)}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          <div className="govuk-form-group">
            <label className="govuk-label" htmlFor="behalf-loc">Location / Landmark</label>
            <input
              className="govuk-input"
              id="behalf-loc"
              type="text"
              value={behalfLocation}
              onChange={(e) => setBehalfLocation(e.target.value)}
              placeholder="Specific address or landmark in Kovilpatti"
              required
            />
          </div>

          <button type="submit" className="govuk-button">
            Register Complaint (Filed by Admin)
          </button>
        </form>
      </div>
    );
  }

  // 3. Manage Officers Page
  if (hash.includes("/admin/officers")) {
    return (
      <div>
        <h2 className="govuk-heading-xl">Manage Department Officers</h2>
        <p className="govuk-body">Register profiles and overview active workloads.</p>

        {/* Add Officer form */}
        <div style={{ background: "#ffffff", padding: "30px", border: "1px solid var(--border-color)", marginBottom: "30px" }}>
          <h3 className="govuk-heading-m">Register New Officer Profile</h3>
          <form onSubmit={handleAddOfficerSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
              <div className="govuk-form-group" style={{ flex: 1, minWidth: "200px", padding: 0, border: "none", marginBottom: 0 }}>
                <label className="govuk-label" style={{ fontSize: "16px" }} htmlFor="officer-name">Officer Full Name</label>
                <input
                  className="govuk-input"
                  id="officer-name"
                  type="text"
                  value={newOfficerName}
                  onChange={(e) => setNewOfficerName(e.target.value)}
                  placeholder="e.g. Samuel Jackson"
                  required
                />
              </div>
              <div className="govuk-form-group" style={{ flex: 1, minWidth: "200px", padding: 0, border: "none", marginBottom: 0 }}>
                <label className="govuk-label" style={{ fontSize: "16px" }} htmlFor="officer-designation">Designation</label>
                <input
                  className="govuk-input"
                  id="officer-designation"
                  type="text"
                  value={newOfficerDesignation}
                  onChange={(e) => setNewOfficerDesignation(e.target.value)}
                  placeholder="e.g. Sanitation Inspector"
                  required
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
              <div className="govuk-form-group" style={{ flex: 1, minWidth: "200px", padding: 0, border: "none", marginBottom: 0 }}>
                <label className="govuk-label" style={{ fontSize: "16px" }} htmlFor="officer-email">Official Email</label>
                <input
                  className="govuk-input"
                  id="officer-email"
                  type="email"
                  value={newOfficerEmail}
                  onChange={(e) => setNewOfficerEmail(e.target.value)}
                  placeholder="e.g. sam@municipal.kov.in"
                  required
                />
              </div>
              <div className="govuk-form-group" style={{ flex: 1, minWidth: "200px", padding: 0, border: "none", marginBottom: 0 }}>
                <label className="govuk-label" style={{ fontSize: "16px" }} htmlFor="officer-phone">Mobile Phone</label>
                <input
                  className="govuk-input"
                  id="officer-phone"
                  type="text"
                  value={newOfficerPhone}
                  onChange={(e) => setNewOfficerPhone(e.target.value)}
                  placeholder="e.g. +91 94421 XXXXX"
                  required
                />
              </div>
              <div className="govuk-form-group" style={{ flex: 1, minWidth: "200px", padding: 0, border: "none", marginBottom: 0 }}>
                <label className="govuk-label" style={{ fontSize: "16px" }} htmlFor="officer-dept">Assigned Department</label>
                <select
                  className="govuk-select"
                  id="officer-dept"
                  value={newOfficerDept}
                  onChange={(e) => setNewOfficerDept(e.target.value)}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <button type="submit" className="govuk-button" style={{ marginBottom: 0 }}>
                Register Officer
              </button>
            </div>
          </form>
        </div>

        {/* Workload list */}
        <h3 className="govuk-heading-m">Current Active Workloads</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
          {officers.map((officer) => {
            const count = officerWorkloads[officer.name] || 0;
            return (
              <div key={officer.officerId || officer.name} style={{ background: "#ffffff", padding: "20px", border: "1px solid var(--border-color)", borderTop: "5px solid var(--govuk-black)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <h4 className="govuk-heading-m" style={{ fontSize: "18px", marginBottom: "5px" }}>{officer.name}</h4>
                  <span className="govuk-hint" style={{ display: "block", marginBottom: "10px" }}>{officer.designation || "Action Officer"}</span>
                  <p className="govuk-body-s" style={{ margin: "2px 0" }}><strong>Dept:</strong> {officer.department}</p>
                  <p className="govuk-body-s" style={{ margin: "2px 0" }}><strong>Email:</strong> {officer.email}</p>
                  <p className="govuk-body-s" style={{ margin: "2px 0" }}><strong>Phone:</strong> {officer.phone}</p>
                </div>
                <div style={{ borderTop: "1px solid #ccc", marginTop: "15px", paddingTop: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                    <span>Active Tasks:</span>
                    <span className={`govuk-tag ${count > 3 ? "govuk-tag--red" : "govuk-tag--green"}`} style={{ fontSize: "16px" }}>
                      {count}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="govuk-button govuk-button--warning"
                    style={{ width: "100%", padding: "4px 8px", fontSize: "14px", marginBottom: 0 }}
                    onClick={() => {
                      if (count > 0) {
                        alert(`Cannot delete officer ${officer.name} because they have ${count} active assignments. Reassign their tasks first.`);
                        return;
                      }
                      if (window.confirm(`Are you sure you want to delete officer profile for ${officer.name}?`)) {
                        deleteOfficer(officer.officerId);
                      }
                    }}
                  >
                    Delete Officer
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 4. Manage Departments/Categories Page
  if (hash.includes("/admin/departments")) {
    return (
      <div>
        <h2 className="govuk-heading-xl">Manage Departments &amp; Categories</h2>
        <p className="govuk-body">Register and modify services, utility categories, and departmental routings.</p>

        {/* Add Category form */}
        <div style={{ background: "#ffffff", padding: "30px", border: "1px solid var(--border-color)", marginBottom: "30px" }}>
          <h3 className="govuk-heading-m">Register New Complaint Category</h3>
          <form onSubmit={handleAddCategorySubmit} style={{ display: "flex", gap: "15px", flexWrap: "wrap", alignItems: "flex-end" }}>
            <div className="govuk-form-group" style={{ flex: 1, minWidth: "250px", padding: 0, border: "none", marginBottom: 0 }}>
              <label className="govuk-label" style={{ fontSize: "16px" }} htmlFor="cat-name">Category Title</label>
              <input
                className="govuk-input"
                id="cat-name"
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="e.g. Street Drainage"
                required
              />
            </div>
            <button type="submit" className="govuk-button">
              Add Category
            </button>
          </form>
        </div>

        {/* Edit Category List */}
        <h3 className="govuk-heading-m">Active Services List</h3>
        <table className="govuk-table">
          <thead>
            <tr>
              <th className="govuk-table__header">Category Name</th>
              <th className="govuk-table__header">Total Complaints</th>
              <th className="govuk-table__header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr className="govuk-table__row" key={cat}>
                <td className="govuk-table__cell">
                  {editingCatName === cat ? (
                    <form onSubmit={(e) => handleEditCategorySubmit(e, cat)} style={{ display: "flex", gap: "10px" }}>
                      <input
                        className="govuk-input"
                        type="text"
                        value={editedCatName}
                        onChange={(e) => setEditedCatName(e.target.value)}
                        required
                        style={{ maxWidth: "200px", padding: "4px 8px", fontSize: "14px" }}
                      />
                      <button type="submit" className="govuk-button" style={{ padding: "4px 8px", fontSize: "12px" }}>
                        Save
                      </button>
                      <button type="button" className="govuk-button govuk-button--secondary" style={{ padding: "4px 8px", fontSize: "12px" }} onClick={() => setEditingCatName("")}>
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <strong style={{ fontSize: "18px" }}>{cat}</strong>
                  )}
                </td>
                <td className="govuk-table__cell">{categoryStats[cat] || 0} registered</td>
                <td className="govuk-table__cell">
                  {editingCatName !== cat && (
                    <button className="govuk-button govuk-button--secondary" style={{ padding: "4px 8px", fontSize: "14px" }} onClick={() => { setEditingCatName(cat); setEditedCatName(cat); }}>
                      Edit Name
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // 5. Reports / Analytics Page
  if (hash.includes("/admin/reports")) {
    return (
      <div>
        <h2 className="govuk-heading-xl">System Analytics Report</h2>
        <p className="govuk-body">Overview resolution metrics, trend indexes and department response performance.</p>

        {/* Categories charts */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", marginBottom: "30px" }}>
          <div style={{ background: "#ffffff", padding: "30px", border: "1px solid var(--border-color)" }}>
            <h3 className="govuk-heading-m">Complaints by Category</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              {categories.map((cat) => {
                const count = categoryStats[cat] || 0;
                const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                return (
                  <div key={cat}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", fontWeight: "700" }}>
                      <span>{cat}</span>
                      <span>{count} ({percentage}%)</span>
                    </div>
                    <div style={{ background: "#e5e7eb", height: "12px", width: "100%", marginTop: "4px" }}>
                      <div style={{ background: "var(--govuk-blue)", height: "100%", width: `${percentage}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ background: "#ffffff", padding: "30px", border: "1px solid var(--border-color)" }}>
            <h3 className="govuk-heading-m">Resolution Status Load</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              {STATUSES.map((status) => {
                const count = stats.byStatus[status] || 0;
                const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                return (
                  <div key={status}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", fontWeight: "700" }}>
                      <span>{status}</span>
                      <span>{count} ({percentage}%)</span>
                    </div>
                    <div style={{ background: "#e5e7eb", height: "12px", width: "100%", marginTop: "4px" }}>
                      <div style={{ background: status === "Completed" ? "var(--govuk-green)" : "var(--govuk-black)", height: "100%", width: `${percentage}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Resolution trend */}
        <div style={{ background: "#ffffff", padding: "30px", border: "1px solid var(--border-color)" }}>
          <h3 className="govuk-heading-m">Resolution Time Speed Trend (Weekly average)</h3>
          <p className="govuk-body">Average duration to update status from "Submitted" to "Completed".</p>
          <div style={{ display: "flex", gap: "20px", alignItems: "flex-end", height: "150px", borderBottom: "2px solid var(--govuk-black)", paddingBottom: "10px" }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ background: "var(--govuk-blue)", width: "30px", height: "120px" }}></div>
              <span className="govuk-hint" style={{ fontSize: "12px" }}>Wk 1 (4.1 days)</span>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ background: "var(--govuk-blue)", width: "30px", height: "100px" }}></div>
              <span className="govuk-hint" style={{ fontSize: "12px" }}>Wk 2 (3.5 days)</span>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ background: "var(--govuk-blue)", width: "30px", height: "70px" }}></div>
              <span className="govuk-hint" style={{ fontSize: "12px" }}>Wk 3 (2.4 days)</span>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ background: "var(--govuk-blue)", width: "30px", height: "55px" }}></div>
              <span className="govuk-hint" style={{ fontSize: "12px" }}>Wk 4 (1.8 days)</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 6. Admin Profile Page
  if (hash.includes("/admin/profile")) {
    return (
      <div>
        <h2 className="govuk-heading-xl">Administrator Profile</h2>
        <p className="govuk-body">System Administrator details and account config.</p>

        <div style={{ background: "#ffffff", padding: "30px", border: "1px solid var(--border-color)" }}>
          <h3 className="govuk-heading-m">Account Credentials</h3>
          <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: "10px" }}>
            <strong>Operator:</strong> <span>{user.name}</span>
            <strong>Official Email:</strong> <span>{user.email}</span>
            <strong>Permission Level:</strong> <span>Full Overlord / Admin</span>
          </div>
        </div>
      </div>
    );
  }

  // 7. Default Dashboard / Overview Page
  return (
    <div>
      <h2 className="govuk-heading-xl">Admin Dashboard Overview</h2>
      <p className="govuk-body">System wide overview and quick activity index.</p>

      {/* Stats summary */}
      <div className="govuk-grid-row">
        <div className="govuk-card govuk-card--blue">
          <div className="govuk-card-value">{stats.total}</div>
          <div className="govuk-card-label">Total Submissions</div>
        </div>
        <div className="govuk-card govuk-card--orange">
          <div className="govuk-card-value">{stats.byStatus["In Progress"] || 0}</div>
          <div className="govuk-card-label">In Progress</div>
        </div>
        <div className="govuk-card govuk-card--green">
          <div className="govuk-card-value">{stats.byStatus["Completed"] || 0}</div>
          <div className="govuk-card-label">Completed</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" }}>
        <div style={{ background: "#ffffff", padding: "30px", border: "1px solid var(--border-color)" }}>
          <h3 className="govuk-heading-m">Recent Submissions Activity</h3>
          {complaints.length > 0 ? (
            <div>
              <p className="govuk-body">Latest registered: <strong>{ticketNo(complaints[0].complaintId)}</strong> - "{complaints[0].title}".</p>
              <button className="govuk-button govuk-button--secondary" onClick={() => navigate(`#/admin/complaint/${complaints[0].complaintId}`)}>
                Oversight Record
              </button>
            </div>
          ) : (
            <p className="govuk-body">No complaints registered in system.</p>
          )}
        </div>

        <div style={{ background: "#ffffff", padding: "30px", border: "1px solid var(--border-color)" }}>
          <h3 className="govuk-heading-m">Active Services Breakdown</h3>
          <p className="govuk-body">Registered service categories: <strong>{categories.length}</strong></p>
          <button className="govuk-button" onClick={() => navigate("#/admin/departments")}>
            Manage Services
          </button>
        </div>
      </div>
    </div>
  );
}
