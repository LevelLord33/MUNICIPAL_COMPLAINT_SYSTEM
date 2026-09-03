import { todayStr } from "./shared";

/**
 * Reducer for managing complaints state.
 * Implements the following actions with strict security and state-machine transitions:
 * - ADD_COMPLAINT: Inserts a new citizen complaint.
 * - ASSIGN_OFFICER: Admin assigns/reassigns an officer.
 * - UPDATE_STATUS: Admin overrides status (requires remark/reason).
 * - ADD_PROGRESS_UPDATE: Officers update status (Assigned -> In Progress -> Completed, requires remark).
 * - WITHDRAW_COMPLAINT: Citizen cancels/withdraws their own complaint (requires reason).
 * - DELETE_COMPLAINT: Admin deletes a complaint.
 */
export function complaintsReducer(state, action) {
  switch (action.type) {
    case "SET_COMPLAINTS":
      return action.payload;

    case "ADD_COMPLAINT": {
      const { data, user } = action.payload;
      // Citizen role check
      if (user.role !== "citizen" && !data.filedByAdmin) {
        throw new Error("Unauthorized: Only citizens can submit complaints.");
      }

      // Mandatory fields check
      if (!data.title?.trim() || !data.description?.trim() || !data.category?.trim() || !data.location?.trim()) {
        throw new Error("Missing mandatory fields.");
      }

      const creatorName = data.filedByAdmin ? `${user.name} (on behalf of Citizen)` : user.name;
      const creatorEmail = data.filedByAdmin ? data.citizenEmail : user.email;

      const newComplaint = {
        complaintId: state.length > 0 ? Math.max(...state.map((c) => c.complaintId)) + 1 : 1,
        title: data.title.trim(),
        description: data.description.trim(),
        category: data.category,
        location: data.location.trim(),
        priority: data.priority || "Medium",
        photo: data.photo || null,
        status: "Submitted",
        citizenName: creatorName,
        citizenEmail: creatorEmail,
        assignedOfficer: null,
        createdAt: todayStr(),
        completionDate: null,
        progressLog: [
          {
            date: todayStr(),
            status: "Submitted",
            remarks: data.filedByAdmin ? `Complaint filed by Admin on behalf of citizen.` : "Complaint filed by citizen.",
            actor: user.name,
            role: user.role
          },
        ],
      };
      return [newComplaint, ...state];
    }

    case "ASSIGN_OFFICER": {
      const { complaintId, officer, user } = action.payload; // officer is officer object or null
      // Admin role check
      if (user.role !== "admin") {
        throw new Error("Unauthorized: Only Admins can assign officers.");
      }

      return state.map((c) => {
        if (c.complaintId !== complaintId) return c;

        // Officer department must match complaint category
        if (officer && officer.department !== c.category) {
          throw new Error(`Unauthorized: Officer department (${officer.department}) does not match complaint category (${c.category}).`);
        }

        const assignedName = officer ? officer.name : null;
        // Directional state machine: Submitted -> Assigned
        const nextStatus = assignedName && c.status === "Submitted" ? "Assigned" : c.status;
        
        const logEntry = {
          date: todayStr(),
          status: nextStatus,
          remarks: assignedName
            ? `Assigned to ${assignedName} (${officer.designation}) by Admin.`
            : "Officer unassigned by Admin.",
          actor: user.name,
          role: user.role
        };

        return {
          ...c,
          assignedOfficer: assignedName,
          status: nextStatus,
          progressLog: [...c.progressLog, logEntry],
        };
      });
    }

    case "UPDATE_STATUS": {
      const { complaintId, newStatus, remarks, user } = action.payload;
      // Admin role check
      if (user.role !== "admin") {
        throw new Error("Unauthorized: Only Admins can override status.");
      }

      if (!remarks?.trim()) {
        throw new Error("Override remark is required.");
      }

      return state.map((c) => {
        if (c.complaintId !== complaintId) return c;

        // Status workflow integrity state machine:
        const validStatuses = ["Submitted", "Assigned", "In Progress", "Completed", "Closed", "Withdrawn"];
        if (!validStatuses.includes(newStatus)) {
          throw new Error("Invalid status.");
        }

        const logEntry = {
          date: todayStr(),
          status: newStatus,
          remarks: `Status manually overridden by Admin. Reason: ${remarks.trim()}`,
          actor: user.name,
          role: user.role
        };

        return {
          ...c,
          status: newStatus,
          completionDate: newStatus === "Completed" || newStatus === "Closed" ? todayStr() : c.completionDate,
          progressLog: [...c.progressLog, logEntry],
        };
      });
    }

    case "ADD_PROGRESS_UPDATE": {
      const { complaintId, newStatus, remarks, user } = action.payload;
      
      // Officer role check
      if (user.role !== "officer") {
        throw new Error("Unauthorized: Only officers can add progress updates.");
      }

      if (!remarks?.trim()) {
        throw new Error("Remarks are required for progress updates.");
      }

      return state.map((c) => {
        if (c.complaintId !== complaintId) return c;

        // Officers can only act on complaints assigned to them
        if (c.assignedOfficer !== user.name) {
          throw new Error("Unauthorized: You are not assigned to this complaint.");
        }

        // Sequential validation: Assigned -> In Progress -> Completed
        // Cannot jump straight from Assigned to Closed, cannot revert Completed back to Submitted
        if (c.status === "Assigned" && newStatus !== "In Progress" && newStatus !== "Completed") {
          throw new Error("Invalid transition: Assigned must go to In Progress or Completed.");
        }
        if (c.status === "In Progress" && newStatus !== "Completed") {
          throw new Error("Invalid transition: In Progress must go to Completed.");
        }
        if (c.status === "Completed" || c.status === "Closed") {
          throw new Error("Complaint is already resolved/closed.");
        }

        const logEntry = {
          date: todayStr(),
          status: newStatus,
          remarks: remarks.trim(),
          actor: user.name,
          role: user.role,
          photos: action.payload.proofPhotos || null
        };

        return {
          ...c,
          status: newStatus,
          completionDate: newStatus === "Completed" ? todayStr() : c.completionDate,
          progressLog: [...c.progressLog, logEntry],
        };
      });
    }

    case "WITHDRAW_COMPLAINT": {
      const { complaintId, remarks, user } = action.payload;
      
      // Citizen check
      if (user.role !== "citizen") {
        throw new Error("Unauthorized: Only citizens can withdraw complaints.");
      }

      if (!remarks?.trim()) {
        throw new Error("A withdrawal reason is required.");
      }

      return state.map((c) => {
        if (c.complaintId !== complaintId) return c;

        // Data boundary ownership check
        if (c.citizenEmail !== user.email) {
          throw new Error("Unauthorized: You do not own this complaint.");
        }

        if (c.status === "Closed" || c.status === "Completed") {
          throw new Error("Cannot withdraw a resolved or closed complaint.");
        }

        const logEntry = {
          date: todayStr(),
          status: "Withdrawn",
          remarks: `Withdrawn by Citizen. Reason: ${remarks.trim()}`,
          actor: user.name,
          role: user.role
        };

        return {
          ...c,
          status: "Withdrawn",
          progressLog: [...c.progressLog, logEntry],
        };
      });
    }

    case "DELETE_COMPLAINT": {
      const { complaintId, user } = action.payload;
      if (user.role !== "admin") {
        throw new Error("Unauthorized: Only Admins can delete records.");
      }
      return state.filter((c) => c.complaintId !== complaintId);
    }

    default:
      return state;
  }
}

