import { createContext, useContext, useEffect, useState } from "react";
import { settingsService } from "../lib/db";

const ThemeContext = createContext(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initTheme = async () => {
      const savedTheme = await settingsService.getDarkMode();
      setDarkMode(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme);
      setLoading(false);
    };

    initTheme();
  }, []);

  const toggleDarkMode = async () => {
    const newValue = !darkMode;
    setDarkMode(newValue);
    document.documentElement.classList.toggle("dark", newValue);
    await settingsService.setDarkMode(newValue);
  };

  const setDarkModeValue = async (value) => {
    setDarkMode(value);
    document.documentElement.classList.toggle("dark", value);
    await settingsService.setDarkMode(value);
  };

  return (
    <ThemeContext.Provider
      value={{
        darkMode,
        toggleDarkMode,
        setDarkMode: setDarkModeValue,
        loading,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
