/**
 * CitizenChatbot.jsx
 *
 * A rule-based, decision-tree guided assistance chatbot for the Citizen portal
 * of the Municipal Complaint Management System (MCMSystem).
 *
 * Design principles:
 *  - Zero external AI API dependency — fully self-contained.
 *  - Reads complaint data from AppContext (no new backend calls).
 *  - Built as an isolated component so the engine can be replaced with a
 *    real AI backend later without touching CitizenDashboard or App.jsx.
 *  - Styled using existing CSS variables from App.css (GOV.UK Design System).
 *  - English-only for this project phase (bilingual extension noted at bottom).
 *
 * Architecture:
 *  - DECISION_TREE: plain-JS map of nodeId → { message, options[], action? }
 *  - State: isOpen, messages[], currentNode, awaitingTicketInput, ticketInputValue
 *  - Quick-reply buttons drive navigation; free-text input is only surfaced
 *    for the ticket-number lookup flow.
 */

import { useState, useEffect, useRef, useContext, useCallback } from "react";
import { AppContext } from "./AppContext";
import { useRouter } from "./router";
import { SLA_RULES, ticketNo, checkSLABreach } from "./shared";

// ---------------------------------------------------------------------------
// ESCALATION CONTACT (update when real contact is confirmed)
// ---------------------------------------------------------------------------
const ESCALATION_PHONE = "+91 04632 - XXXXXX";
const ESCALATION_EMAIL = "grievance@kovilpatti.tn.gov.in";
const ESCALATION_HOURS = "Monday – Friday, 9:00 AM – 5:30 PM";

// ---------------------------------------------------------------------------
// SLA SUMMARY: human-readable resolution targets per category
// ---------------------------------------------------------------------------
function buildSLASummary() {
  return Object.entries(SLA_RULES)
    .map(([cat, rules]) => {
      const toLabel = (h) => {
        if (h < 24) return `${h} hours`;
        return h % 24 === 0 ? `${h / 24} day${h / 24 > 1 ? "s" : ""}` : `${h} hours`;
      };
      return `• ${cat}: High — ${toLabel(rules.High)}, Medium — ${toLabel(rules.Medium)}, Low — ${toLabel(rules.Low)}`;
    })
    .join("\n");
}

// ---------------------------------------------------------------------------
// DECISION TREE
// Each node: { message, options: [{ label, next, action? }], freeInput? }
// action(ctx) is called when the option is chosen; ctx = { navigate, myComplaints }
// ---------------------------------------------------------------------------
const DECISION_TREE = {
  root: {
    message:
      "Hello. I am the MCMSystem Citizen Assistant.\n\nI can help you file a complaint correctly, check on your submissions, or answer common questions about this portal.\n\nWhat would you like help with today?",
    options: [
      { label: "How do I file a complaint?", next: "how_to_file" },
      { label: "I am not sure of the category", next: "category_guide" },
      { label: "Check my complaint status", next: "check_status" },
      { label: "What does each status mean?", next: "status_meanings" },
      { label: "How long does resolution take?", next: "sla_info" },
      { label: "My complaint seems overdue", next: "overdue_escalation" },
    ],
  },

  how_to_file: {
    message:
      "Before you file a complaint, please have the following information ready:\n\n1. Title — a short, clear description (e.g. \"Pothole on Main Road near Bus Stop\")\n2. Detailed description — what the problem is, how long it has existed, and who it affects\n3. Category — the type of civic issue (Road, Water, Electricity, Garbage, or Streetlight)\n4. Location — the specific street, landmark, or locality\n5. Priority — Low, Medium, or High based on urgency\n6. Evidence photo — optional, but strongly recommended (JPG, PNG, or WebP, max 5 MB each, up to 3 photos)\n\nYou must also confirm that the details are accurate before submitting.",
    options: [
      { label: "Go to the complaint form", next: "end", action: ({ navigate }) => navigate("#/citizen/new-complaint") },
      { label: "Help me choose a category", next: "category_guide" },
      { label: "Back to main menu", next: "root" },
    ],
  },

  category_guide: {
    message:
      "Please select the issue type that best describes your complaint and I will suggest the correct category:",
    options: [
      { label: "Roads, potholes, or footpaths", next: "category_road" },
      { label: "Water supply or drainage", next: "category_water" },
      { label: "Power outage or electrical fault", next: "category_electricity" },
      { label: "Garbage or waste collection", next: "category_garbage" },
      { label: "Street or public lighting", next: "category_streetlight" },
      { label: "Not sure / something else", next: "cannot_help" },
      { label: "Back to main menu", next: "root" },
    ],
  },

  category_road: {
    message:
      "Your issue falls under the Road category.\n\nThis includes potholes, damaged footpaths, road cave-ins, broken speed-breakers, and encroachments on roads.\n\nThe assigned department is Public Works. Typical resolution targets:\n• High priority — 36 hours\n• Medium priority — 3 days\n• Low priority — 6 days\n\nWould you like to go directly to the complaint form with this category pre-selected?",
    options: [
      {
        label: "Go to form — Road category pre-selected",
        next: "end",
        action: ({ navigate }) => navigate("#/citizen/new-complaint?category=Road"),
      },
      { label: "Back to category list", next: "category_guide" },
    ],
  },

  category_water: {
    message:
      "Your issue falls under the Water category.\n\nThis includes water supply disruption, pipe leaks, low water pressure, contaminated water, and blocked drains.\n\nThe assigned department is Water Works. Typical resolution targets:\n• High priority — 24 hours\n• Medium priority — 2 days\n• Low priority — 4 days\n\nWould you like to go directly to the complaint form with this category pre-selected?",
    options: [
      {
        label: "Go to form — Water category pre-selected",
        next: "end",
        action: ({ navigate }) => navigate("#/citizen/new-complaint?category=Water"),
      },
      { label: "Back to category list", next: "category_guide" },
    ],
  },

  category_electricity: {
    message:
      "Your issue falls under the Electricity category.\n\nThis includes power outages affecting a locality, damaged electrical poles, exposed wiring, and transformer faults.\n\nNote: For individual household power supply issues, please contact TANGEDCO directly.\n\nThe assigned department is Electrical Inspection. Typical resolution targets:\n• High priority — 12 hours\n• Medium priority — 24 hours\n• Low priority — 2 days\n\nWould you like to go directly to the complaint form with this category pre-selected?",
    options: [
      {
        label: "Go to form — Electricity category pre-selected",
        next: "end",
        action: ({ navigate }) => navigate("#/citizen/new-complaint?category=Electricity"),
      },
      { label: "Back to category list", next: "category_guide" },
    ],
  },

  category_garbage: {
    message:
      "Your issue falls under the Garbage category.\n\nThis includes missed garbage collection, overflowing public bins, illegal dumping, and sanitation hygiene concerns.\n\nThe assigned department is Sanitation. Typical resolution targets:\n• High priority — 6 hours\n• Medium priority — 12 hours\n• Low priority — 24 hours\n\nWould you like to go directly to the complaint form with this category pre-selected?",
    options: [
      {
        label: "Go to form — Garbage category pre-selected",
        next: "end",
        action: ({ navigate }) => navigate("#/citizen/new-complaint?category=Garbage"),
      },
      { label: "Back to category list", next: "category_guide" },
    ],
  },

  category_streetlight: {
    message:
      "Your issue falls under the Streetlight category.\n\nThis includes non-functioning street lamps, flickering lights, broken light poles, and areas with insufficient public lighting.\n\nThe assigned department is Lighting Coordination. Typical resolution targets:\n• High priority — 12 hours\n• Medium priority — 24 hours\n• Low priority — 2 days\n\nWould you like to go directly to the complaint form with this category pre-selected?",
    options: [
      {
        label: "Go to form — Streetlight category pre-selected",
        next: "end",
        action: ({ navigate }) => navigate("#/citizen/new-complaint?category=Streetlight"),
      },
      { label: "Back to category list", next: "category_guide" },
    ],
  },

  check_status: {
    // message is dynamically generated in getStatusMessage()
    message: "__STATUS_LOOKUP__",
    options: [
      { label: "View all my complaints", next: "end", action: ({ navigate }) => navigate("#/citizen/my-complaints") },
      { label: "What does each status mean?", next: "status_meanings" },
      { label: "My complaint is overdue", next: "overdue_escalation" },
      { label: "Back to main menu", next: "root" },
    ],
  },

  status_meanings: {
    message:
      "Each complaint passes through the following stages:\n\n🟡 Submitted — Your complaint has been received and is awaiting review by the administration.\n\n🔵 Assigned — An officer from the relevant department has been assigned to investigate your complaint.\n\n🔶 In Progress — The assigned officer has begun field work on your complaint.\n\n🟢 Completed — The officer has resolved the issue and submitted a completion report. You may review the outcome.\n\n⬛ Closed — The administration has formally closed the complaint after review.",
    options: [
      { label: "How long does each stage take?", next: "sla_info" },
      { label: "My complaint is overdue", next: "overdue_escalation" },
      { label: "Back to main menu", next: "root" },
    ],
  },

  stepper_explained: {
    message:
      "The progress bar on your complaint detail page shows five stages:\n\nSubmitted → Assigned → In Progress → Completed → Closed\n\nGreen stages are completed. The blue stage is where your complaint currently is. Grey stages are yet to happen.\n\nYou will not see the Withdrawn stage on the bar — a withdrawn complaint is shown separately with a red indicator.",
    options: [
      { label: "What does each status mean?", next: "status_meanings" },
      { label: "Back to main menu", next: "root" },
    ],
  },

  sla_info: {
    message:
      "Resolution targets (Service Level Agreement) vary by category and priority:\n\n" +
      buildSLASummary() +
      "\n\nThese are target deadlines, not guarantees. Complex or high-priority issues may require coordination with external agencies.\n\nIf your complaint is past its target date and still unresolved, you can escalate using the contact information provided in the escalation section.",
    options: [
      { label: "My complaint is overdue", next: "overdue_escalation" },
      { label: "Back to main menu", next: "root" },
    ],
  },

  overdue_escalation: {
    message:
      "If your complaint has not been resolved within the expected timeframe, you may escalate it through the following channels:\n\n📞 Grievance Helpline: " +
      ESCALATION_PHONE +
      "\n📧 Email: " +
      ESCALATION_EMAIL +
      "\n🕐 Office hours: " +
      ESCALATION_HOURS +
      "\n\nWhen contacting, please have your Ticket Number (MCM-XXXX) ready.\n\nYou can also use the Help & Support page for additional guidance.",
    options: [
      { label: "Go to Help & Support", next: "end", action: ({ navigate }) => navigate("#/support") },
      { label: "View my complaints", next: "end", action: ({ navigate }) => navigate("#/citizen/my-complaints") },
      { label: "Back to main menu", next: "root" },
    ],
  },

  cannot_help: {
    message:
      "I am sorry — I was unable to find a matching category for your issue, or this assistant does not have an answer for that query at this time.\n\nFor issues outside the five standard categories (Road, Water, Electricity, Garbage, Streetlight), please contact the helpline directly:\n\n📞 " +
      ESCALATION_PHONE +
      "\n📧 " +
      ESCALATION_EMAIL +
      "\n🕐 " +
      ESCALATION_HOURS,
    options: [
      { label: "Go to Help & Support", next: "end", action: ({ navigate }) => navigate("#/support") },
      { label: "Back to main menu", next: "root" },
    ],
  },

  end: {
    message: "Is there anything else I can help you with?",
    options: [
      { label: "Yes, back to main menu", next: "root" },
      { label: "No, thank you — close assistant", next: "__close__" },
    ],
  },
};

// ---------------------------------------------------------------------------
// Helper: build dynamic status lookup message for check_status node
// ---------------------------------------------------------------------------
function getStatusMessage(myComplaints) {
  if (!myComplaints || myComplaints.length === 0) {
    return "You do not have any complaints on record yet.\n\nWould you like to file one?";
  }

  const recent = [...myComplaints]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const lines = recent.map((c) => {
    const overdue = checkSLABreach(c.createdAt, c.category, c.priority, c.status, c.completionDate);
    const overdueTag =
      overdue && !["Completed", "Closed", "Withdrawn"].includes(c.status) ? " ⚠ Overdue" : "";
    return `• ${ticketNo(c.complaintId)} — ${c.category} — ${c.status}${overdueTag}`;
  });

  const suffix = myComplaints.length > 5 ? `\n\n(Showing your 5 most recent. View all from My Complaints.)` : "";

  return (
    `Here is a summary of your recent complaints:\n\n${lines.join("\n")}${suffix}\n\n` +
    `Click "View all my complaints" below to see full details and the progress timeline for each ticket.`
  );
}

// ---------------------------------------------------------------------------
// CHATBOT COMPONENT
// ---------------------------------------------------------------------------
export default function CitizenChatbot() {
  const { complaints, user } = useContext(AppContext);
  const { navigate } = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [currentNode, setCurrentNode] = useState("root");
  const [isTyping, setIsTyping] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);

  const messagesEndRef = useRef(null);

  // Complaints belonging to this citizen
  const myComplaints = complaints.filter((c) => c.citizenEmail === user?.email);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isTyping]);

  // Seed the greeting when panel first opens
  useEffect(() => {
    if (isOpen && !hasGreeted) {
      const node = DECISION_TREE["root"];
      setMessages([{ role: "bot", text: node.message, nodeId: "root" }]);
      setCurrentNode("root");
      setHasGreeted(true);
    }
  }, [isOpen, hasGreeted]);

  // Resolve the message for a node (status lookup is dynamic)
  const resolveMessage = useCallback(
    (nodeId) => {
      const node = DECISION_TREE[nodeId];
      if (!node) return "An error occurred. Please try again.";
      if (node.message === "__STATUS_LOOKUP__") {
        return getStatusMessage(myComplaints);
      }
      return node.message;
    },
    [myComplaints]
  );

  const handleOptionClick = useCallback(
    (option) => {
      if (!option) return;

      // Run side-effect action if defined
      if (option.action) {
        option.action({ navigate, myComplaints });
      }

      const next = option.next;

      // Special: close the panel
      if (next === "__close__") {
        // Add user choice to history
        setMessages((prev) => [
          ...prev,
          { role: "user", text: option.label },
          { role: "bot", text: "Understood. This assistant window will now close. Have a good day." },
        ]);
        setTimeout(() => setIsOpen(false), 1200);
        return;
      }

      const botMessage = resolveMessage(next);

      // Add user message immediately, then simulate a short bot typing delay
      setMessages((prev) => [...prev, { role: "user", text: option.label }]);
      setIsTyping(true);

      setTimeout(() => {
        setMessages((prev) => [...prev, { role: "bot", text: botMessage, nodeId: next }]);
        setCurrentNode(next);
        setIsTyping(false);
      }, 400);
    },
    [navigate, myComplaints, resolveMessage]
  );

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleClose = () => setIsOpen(false);

  const handleRestart = () => {
    setMessages([{ role: "bot", text: DECISION_TREE["root"].message, nodeId: "root" }]);
    setCurrentNode("root");
  };

  // Current node options
  const currentOptions = DECISION_TREE[currentNode]?.options || [];

  // Count overdue complaints for FAB badge
  const overdueCount = myComplaints.filter(
    (c) =>
      !["Completed", "Closed", "Withdrawn"].includes(c.status) &&
      checkSLABreach(c.createdAt, c.category, c.priority, c.status, c.completionDate)
  ).length;

  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* FLOATING ACTION BUTTON                                              */}
      {/* ------------------------------------------------------------------ */}
      <button
        id="chatbot-fab"
        className={`chatbot-fab ${isOpen ? "chatbot-fab--open" : ""}`}
        onClick={handleToggle}
        aria-label={isOpen ? "Close citizen assistant" : "Open citizen assistant"}
        aria-expanded={isOpen}
        title={isOpen ? "Close assistant" : "Citizen Assistance"}
      >
        {isOpen ? (
          // X icon when open
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          // Chat icon when closed
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
        {!isOpen && overdueCount > 0 && (
          <span className="chatbot-fab-badge" aria-label={`${overdueCount} overdue complaint${overdueCount > 1 ? "s" : ""}`}>
            {overdueCount}
          </span>
        )}
      </button>

      {/* ------------------------------------------------------------------ */}
      {/* CHAT PANEL                                                          */}
      {/* ------------------------------------------------------------------ */}
      <div
        className={`chatbot-panel ${isOpen ? "chatbot-panel--open" : ""}`}
        role="dialog"
        aria-modal="false"
        aria-label="Citizen assistance chatbot"
      >
        {/* Header */}
        <div className="chatbot-header">
          <div className="chatbot-header-brand">
            <span className="chatbot-header-icon" aria-hidden="true">🏛️</span>
            <div>
              <div className="chatbot-header-title">Citizen Assistant</div>
              <div className="chatbot-header-subtitle">MCMSystem — Guided Help</div>
            </div>
          </div>
          <div className="chatbot-header-actions">
            <button
              className="chatbot-header-btn"
              onClick={handleRestart}
              title="Restart conversation"
              aria-label="Restart conversation"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 .49-3.4" />
              </svg>
            </button>
            <button
              className="chatbot-header-btn"
              onClick={handleClose}
              title="Close assistant"
              aria-label="Close assistant"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Overdue banner */}
        {overdueCount > 0 && (
          <div className="chatbot-overdue-banner" role="alert">
            ⚠ You have {overdueCount} overdue complaint{overdueCount > 1 ? "s" : ""}. Select &ldquo;My complaint seems overdue&rdquo; for escalation contact.
          </div>
        )}

        {/* Message list */}
        <div className="chatbot-messages" aria-live="polite" aria-label="Conversation">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`chatbot-bubble-wrap ${msg.role === "user" ? "chatbot-bubble-wrap--user" : "chatbot-bubble-wrap--bot"}`}
            >
              {msg.role === "bot" && (
                <span className="chatbot-avatar" aria-hidden="true">🏛️</span>
              )}
              <div
                className={`chatbot-bubble ${msg.role === "user" ? "chatbot-bubble--user" : "chatbot-bubble--bot"}`}
              >
                {/* Preserve line breaks in bot messages */}
                {msg.text.split("\n").map((line, li) => (
                  <span key={li}>
                    {line}
                    {li < msg.text.split("\n").length - 1 && <br />}
                  </span>
                ))}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="chatbot-bubble-wrap chatbot-bubble-wrap--bot">
              <span className="chatbot-avatar" aria-hidden="true">🏛️</span>
              <div className="chatbot-bubble chatbot-bubble--bot chatbot-typing">
                <span className="chatbot-dot" />
                <span className="chatbot-dot" />
                <span className="chatbot-dot" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick-reply options */}
        {!isTyping && currentOptions.length > 0 && (
          <div className="chatbot-options" role="group" aria-label="Reply options">
            {currentOptions.map((opt) => (
              <button
                key={opt.label}
                className="chatbot-option-btn"
                onClick={() => handleOptionClick(opt)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="chatbot-footer">
          This assistant provides guidance only. For urgent civic emergencies, contact the helpline directly.
        </div>
      </div>
    </>
  );
}

/*
 * FUTURE EXTENSION NOTES
 * ----------------------
 * To upgrade this component to an AI-backed assistant:
 *   1. Replace the DECISION_TREE lookup in handleOptionClick with an async
 *      fetch() call to your AI endpoint.
 *   2. Remove the isTyping setTimeout and use the actual API response latency.
 *   3. Add freeText input (awaitingInput state already modelled in design notes)
 *      for open-ended queries.
 *   4. Keep AppContext integration unchanged — the status lookup pattern stays.
 *
 * To add Tamil language support:
 *   1. Create DECISION_TREE_TA with Tamil strings in the same structure.
 *   2. Accept `language` prop (from AppContext) and switch trees:
 *      const tree = language === "ta" ? DECISION_TREE_TA : DECISION_TREE;
 */
