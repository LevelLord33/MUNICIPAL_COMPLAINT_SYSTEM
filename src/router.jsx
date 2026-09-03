import { createContext, useState, useEffect, useContext } from "react";

const RouterContext = createContext(null);

export function RouterProvider({ children }) {
  const [hash, setHash] = useState(window.location.hash || "#/");

  useEffect(() => {
    const handleHashChange = () => {
      setHash(window.location.hash || "#/");
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const navigate = (path) => {
    window.location.hash = path;
  };

  return (
    <RouterContext.Provider value={{ hash, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error("useRouter must be used within a RouterProvider");
  }
  return context;
}

// Simple route pattern matcher, e.g. "/citizen/complaint/:id" matches "#/citizen/complaint/5"
export function matchRoute(pattern, currentHash) {
  // Strip "#" from hash
  const path = currentHash.replace(/^#/, "");
  
  const patternParts = pattern.split("/");
  const pathParts = path.split("/");

  if (patternParts.length !== pathParts.length) {
    return { matches: false, params: {} };
  }

  const params = {};
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(":")) {
      const paramName = patternParts[i].slice(1);
      params[paramName] = pathParts[i];
    } else if (patternParts[i] !== pathParts[i]) {
      return { matches: false, params: {} };
    }
  }

  return { matches: true, params };
}
