// ---------------------------------------------------------
// Shared constants and small reusable pieces used across
// the Admin, Officer, and Citizen dashboards.
// ---------------------------------------------------------

export const CATEGORIES = ["Road", "Water", "Electricity", "Garbage", "Streetlight"];
export const PRIORITIES = ["Low", "Medium", "High"];
export const STATUSES = ["Submitted", "Assigned", "In Progress", "Completed", "Closed"];

export const DEFAULT_OFFICERS = [
  {
    officerId: 1,
    name: "Ramesh Kumar",
    email: "ramesh@municipal.kov.in",
    phone: "+91 94421 11111",
    designation: "Electrical Inspector",
    department: "Electricity",
  },
  {
    officerId: 2,
    name: "Priya Selvam",
    email: "priya@municipal.kov.in",
    phone: "+91 94421 22222",
    designation: "Water Works Engineer",
    department: "Water",
  },
  {
    officerId: 3,
    name: "Arun Vel",
    email: "arun@municipal.kov.in",
    phone: "+91 94421 33333",
    designation: "Sanitation Inspector",
    department: "Garbage",
  },
  {
    officerId: 4,
    name: "Subramanian",
    email: "subbu@municipal.kov.in",
    phone: "+91 94421 44444",
    designation: "Lighting Coordinator",
    department: "Streetlight",
  },
  {
    officerId: 5,
    name: "Muthu Karuppan",
    email: "muthu@municipal.kov.in",
    phone: "+91 94421 55555",
    designation: "Assistant Engineer - Roads",
    department: "Road",
  }
];

// SLA Duration mapping in hours based on category and priority
// Stricter resolution window for High priority, standard for Medium, extended for Low
export const SLA_RULES = {
  Garbage: { High: 6, Medium: 12, Low: 24 },
  Water: { High: 24, Medium: 48, Low: 96 },
  Electricity: { High: 12, Medium: 24, Low: 48 },
  Streetlight: { High: 12, Medium: 24, Low: 48 },
  Road: { High: 36, Medium: 72, Low: 144 },
};

export function ticketNo(id) {
  return `MCM-${String(id).padStart(4, "0")}`;
}

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// Calculate the SLA deadline date-time (or simple date offset) based on createdAt date
export function getSLADeadline(createdAt, category, priority) {
  if (!createdAt) return todayStr();
  const rules = SLA_RULES[category] || { High: 24, Medium: 48, Low: 96 };
  const hours = rules[priority] || rules["Medium"];
  
  const createdDate = new Date(createdAt);
  createdDate.setHours(createdDate.getHours() + hours);
  return createdDate.toISOString().slice(0, 10);
}

// Check if a complaint has breached SLA
export function checkSLABreach(createdAt, category, priority, status, completionDate) {
  const deadlineStr = getSLADeadline(createdAt, category, priority);
  const targetDate = status === "Completed" || status === "Closed" ? (completionDate || todayStr()) : todayStr();
  return new Date(targetDate) > new Date(deadlineStr);
}

export function StatusStamp({ status }) {
  return (
    <span className={`status-stamp status-${status.replace(/\s+/g, "-").toLowerCase()}`}>
      {status}
    </span>
  );
}

export function PriorityDot({ priority }) {
  return <span className={`priority-dot dot-${priority.toLowerCase()}`} />;
}

// ---------------------------------------------------------
// ComplaintFilterBar — shared search + filter bar used on
// every complaint-list page. Role-specific controls are
// passed via the `extraControls` prop (any JSX).
// ---------------------------------------------------------
export function ComplaintFilterBar({
  searchQuery,
  onSearchChange,
  filterCategory,
  onCategoryChange,
  categories,
  filterStatus,
  onStatusChange,
  searchPlaceholder = "Search by ticket ID, title, or description...",
  searchLabel = "Search",
  extraControls = null,
}) {
  return (
    <div style={{ background: "#ffffff", padding: "20px", border: "1px solid var(--border-color)", marginBottom: "30px" }}>
      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", alignItems: "flex-end" }}>
        {/* Search — takes remaining space */}
        <div style={{ flex: "2 1 260px" }}>
          <label className="govuk-label" style={{ fontSize: "16px" }} htmlFor="cfb-search">
            {searchLabel}
          </label>
          <input
            className="govuk-input"
            id="cfb-search"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
          />
        </div>

        {/* Category dropdown */}
        <div style={{ flex: "0 0 auto" }}>
          <label className="govuk-label" style={{ fontSize: "16px" }} htmlFor="cfb-category">
            Category
          </label>
          <select
            className="govuk-select"
            id="cfb-category"
            value={filterCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
          >
            <option value="All">All Categories</option>
            {(categories || []).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Status dropdown */}
        <div style={{ flex: "0 0 auto" }}>
          <label className="govuk-label" style={{ fontSize: "16px" }} htmlFor="cfb-status">
            Status
          </label>
          <select
            className="govuk-select"
            id="cfb-status"
            value={filterStatus}
            onChange={(e) => onStatusChange(e.target.value)}
          >
            <option value="All">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Role-specific extra controls (Sort By, Bulk Action, etc.) */}
        {extraControls}
      </div>
    </div>
  );
}

// ---------------------------------------------------------
// ComplaintTable — shared table used on every complaint-list
// page. Renders the base 6 columns: Ticket ID, Title,
// Category, Priority, Status, Actions.
//
// Props:
//   complaints      — array of complaint objects to render
//   extraColumns    — array of { header, render(c) } inserted
//                     after Priority, before Status
//   emptyMessage    — string shown when the list is empty
//   onAction(c)     — callback when the action button is clicked
//   actionLabel     — label for the action button (or fn(c)=>string)
//   actionClassName — govuk-button modifier class (default: secondary)
// ---------------------------------------------------------
export function ComplaintTable({
  complaints,
  extraColumns = [],
  emptyMessage = "No complaints found.",
  onAction,
  actionLabel = "View Details",
  actionClassName = "govuk-button govuk-button--secondary",
}) {
  const totalCols = 6 + extraColumns.length;

  const statusTagClass = (status) => {
    switch (status) {
      case "Completed": return "govuk-tag--green";
      case "In Progress": return "govuk-tag--orange";
      case "Assigned": return "govuk-tag--purple";
      case "Closed": return "govuk-tag--grey";
      case "Withdrawn": return "govuk-tag--grey";
      default: return "govuk-tag--blue";
    }
  };

  return (
    <div style={{ background: "#ffffff", border: "1px solid var(--border-color)" }}>
      <table className="govuk-table" style={{ marginBottom: 0 }}>
        <thead>
          <tr>
            <th className="govuk-table__header" style={{ textAlign: "right", width: "110px" }}>Ticket ID</th>
            <th className="govuk-table__header">Title</th>
            <th className="govuk-table__header">Category</th>
            <th className="govuk-table__header">Priority</th>
            {extraColumns.map((col) => (
              <th key={col.header} className="govuk-table__header">{col.header}</th>
            ))}
            <th className="govuk-table__header">Status</th>
            <th className="govuk-table__header">Actions</th>
          </tr>
        </thead>
        <tbody>
          {complaints.map((c) => {
            const label = typeof actionLabel === "function" ? actionLabel(c) : actionLabel;
            return (
              <tr className="govuk-table__row" key={c.complaintId}>
                <td className="govuk-table__cell" style={{ fontWeight: "700", textAlign: "right" }}>
                  {ticketNo(c.complaintId)}
                </td>
                <td className="govuk-table__cell">{c.title}</td>
                <td className="govuk-table__cell">{c.category}</td>
                <td className="govuk-table__cell">
                  <span style={{
                    fontWeight: c.priority === "High" ? "700" : "400",
                    color: c.priority === "High" ? "var(--govuk-red)" : "inherit"
                  }}>
                    {c.priority}
                  </span>
                </td>
                {extraColumns.map((col) => (
                  <td key={col.header} className="govuk-table__cell">{col.render(c)}</td>
                ))}
                <td className="govuk-table__cell">
                  <span className={`govuk-tag ${statusTagClass(c.status)}`}>{c.status}</span>
                </td>
                <td className="govuk-table__cell">
                  <button
                    className={actionClassName}
                    style={{ padding: "4px 8px", fontSize: "14px", marginBottom: 0 }}
                    onClick={() => onAction(c)}
                  >
                    {label}
                  </button>
                </td>
              </tr>
            );
          })}
          {complaints.length === 0 && (
            <tr>
              <td
                className="govuk-table__cell"
                colSpan={totalCols}
                style={{ textAlign: "center", padding: "30px", color: "var(--text-secondary)" }}
              >
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

