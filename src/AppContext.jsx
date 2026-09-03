import { createContext, useState, useEffect, useReducer, useCallback } from "react";
import useLocalStorage from "./useLocalStorage";
import { complaintsReducer } from "./complaintsReducer";
import { DEFAULT_OFFICERS, CATEGORIES } from "./shared";
import { translations } from "./translations";

export const AppContext = createContext();

const DEFAULT_COMPLAINTS = [
  {
    complaintId: 1,
    title: "Streetlight not working",
    description: "The streetlight near the main bus stop has been off for a week.",
    category: "Electricity",
    location: "Main Bus Stand, Kovilpatti",
    priority: "Medium",
    status: "In Progress",
    citizenName: "Hari",
    citizenEmail: "hari@example.com",
    assignedOfficer: "Ramesh Kumar",
    createdAt: "2026-07-28",
    completionDate: null,
    progressLog: [
      { date: "2026-07-28", status: "Submitted", remarks: "Complaint filed by citizen.", actor: "Hari", role: "citizen" },
      { date: "2026-07-29", status: "Assigned", remarks: "Assigned to Ramesh Kumar by Admin.", actor: "Administrator", role: "admin" },
      { date: "2026-07-30", status: "In Progress", remarks: "Site visited, faulty wiring identified.", actor: "Ramesh Kumar", role: "officer" },
    ],
  },
];

export function AppContextProvider({ children }) {
  // Auth state using useState
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  // Registered citizens list using custom hook useLocalStorage
  const [citizens, setCitizens] = useLocalStorage("citizens", [
    { citizenId: 1, name: "Hari", email: "hari@example.com", phone: "+91 94421 99999", password: "1234", address: "Kovilpatti" }
  ]);

  // Officers state: migrate old storage array of strings if detected
  const [officers, setOfficers] = useLocalStorage("officers", DEFAULT_OFFICERS);
  
  useEffect(() => {
    if (officers && officers.length > 0 && typeof officers[0] === "string") {
      setOfficers(DEFAULT_OFFICERS);
    }
  }, [officers, setOfficers]);

  // Categories state using custom hook useLocalStorage
  const [categories, setCategories] = useLocalStorage("categories", CATEGORIES);

  // Complaints state using useReducer (initialized from localStorage or default)
  const [complaints, dispatch] = useReducer(complaintsReducer, [], () => {
    try {
      const saved = localStorage.getItem("complaints");
      return saved ? JSON.parse(saved) : DEFAULT_COMPLAINTS;
    } catch (e) {
      console.error("Error loading complaints from localStorage:", e);
      return DEFAULT_COMPLAINTS;
    }
  });

  // Save complaints to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem("complaints", JSON.stringify(complaints));
    } catch (e) {
      console.error("Error saving complaints to localStorage:", e);
    }
  }, [complaints]);

  // Auth functions
  const handleLogin = useCallback((loggedInUser) => {
    setUser(loggedInUser);
    setIsLoggedIn(true);
  }, []);

  const handleLogout = useCallback(() => {
    setIsLoggedIn(false);
    setUser(null);
  }, []);

  // Citizen registration
  const handleRegisterCitizen = useCallback((citizenData) => {
    let success = false;
    let errorMsg = "";
    
    setCitizens((prev) => {
      const emailExists = prev.some((c) => c.email.toLowerCase() === citizenData.email.toLowerCase());
      const phoneExists = prev.some((c) => c.phone === citizenData.phone);
      if (emailExists) {
        errorMsg = "Email address is already registered.";
        return prev;
      }
      if (phoneExists) {
        errorMsg = "Phone number is already registered.";
        return prev;
      }
      success = true;
      const nextId = prev.length > 0 ? Math.max(...prev.map((c) => c.citizenId || 0)) + 1 : 1;
      return [...prev, { citizenId: nextId, ...citizenData }];
    });

    if (!success) {
      throw new Error(errorMsg);
    }
  }, [setCitizens]);

  // Action wrappers enforcing RBAC
  const handleSubmitComplaint = useCallback((data) => {
    if (!user) return;
    dispatch({ type: "ADD_COMPLAINT", payload: { data, user } });
  }, [user]);

  const handleAssignOfficer = useCallback((complaintId, officerName) => {
    if (!user) return;
    const officerObj = officers.find((o) => o.name === officerName);
    dispatch({ type: "ASSIGN_OFFICER", payload: { complaintId, officer: officerObj, user } });
  }, [officers, user]);

  const handleUpdateStatus = useCallback((complaintId, newStatus, remarks) => {
    if (!user) return;
    dispatch({ type: "UPDATE_STATUS", payload: { complaintId, newStatus, remarks, user } });
  }, [user]);

  const handleAddProgressUpdate = useCallback((complaintId, newStatus, remarks, proofPhotos) => {
    if (!user) return;
    dispatch({ type: "ADD_PROGRESS_UPDATE", payload: { complaintId, newStatus, remarks, proofPhotos, user } });
  }, [user]);

  const handleWithdrawComplaint = useCallback((complaintId, remarks) => {
    if (!user) return;
    dispatch({ type: "WITHDRAW_COMPLAINT", payload: { complaintId, remarks, user } });
  }, [user]);

  const handleDeleteComplaint = useCallback((complaintId) => {
    if (!user) return;
    dispatch({ type: "DELETE_COMPLAINT", payload: { complaintId, user } });
  }, [user]);

  const handleAddOfficer = useCallback((officerData) => {
    setOfficers((prevOfficers) => {
      const nextId = prevOfficers.length > 0 ? Math.max(...prevOfficers.map((o) => o.officerId || 0)) + 1 : 1;
      return [...prevOfficers, { officerId: nextId, ...officerData }];
    });
  }, [setOfficers]);

  const handleDeleteOfficer = useCallback((id) => {
    setOfficers((prev) => prev.filter((o) => o.officerId !== id));
  }, [setOfficers]);

  const handleAddCategory = useCallback((cat) => {
    setCategories((prev) => {
      if (!prev.includes(cat)) {
        return [...prev, cat];
      }
      return prev;
    });
  }, [setCategories]);

  const handleEditCategory = useCallback((oldCat, newCat) => {
    setCategories((prev) => {
      return prev.map((c) => (c === oldCat ? newCat : c));
    });
  }, [setCategories]);

  const [language, setLanguage] = useLocalStorage("language", "en");

  const t = useCallback((key) => {
    if (!translations[language]) return key;
    return translations[language][key] || translations["en"][key] || key;
  }, [language]);

  return (
    <AppContext.Provider
      value={{
        isLoggedIn,
        user,
        citizens,
        officers,
        categories,
        complaints,
        login: handleLogin,
        logout: handleLogout,
        registerCitizen: handleRegisterCitizen,
        submitComplaint: handleSubmitComplaint,
        assignOfficer: handleAssignOfficer,
        updateStatus: handleUpdateStatus,
        addProgressUpdate: handleAddProgressUpdate,
        withdrawComplaint: handleWithdrawComplaint,
        deleteComplaint: handleDeleteComplaint,
        addOfficer: handleAddOfficer,
        deleteOfficer: handleDeleteOfficer,
        addCategory: handleAddCategory,
        editCategory: handleEditCategory,
        language,
        setLanguage,
        t,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}


