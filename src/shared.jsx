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

