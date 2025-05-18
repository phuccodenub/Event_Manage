import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Tạo CSS style element cho dark mode
const createDarkModeStyles = () => {
  const styleElement = document.createElement('style');
  styleElement.id = 'dark-mode-styles';
  styleElement.textContent = `
    body.dark-mode {
      background-color: #1a1a1a !important;
      color: #f5f5f5 !important;
    }
    
    body.dark-mode .bg-white {
      background-color: #2a2a2a !important;
    }
    
    body.dark-mode .bg-gray-50 {
      background-color: #222222 !important;
    }
    
    body.dark-mode .text-gray-900 {
      color: #f5f5f5 !important;
    }
    
    body.dark-mode .text-gray-800 {
      color: #f0f0f0 !important;
    }
    
    body.dark-mode .text-gray-700 {
      color: #e0e0e0 !important;
    }
    
    body.dark-mode .text-gray-600 {
      color: #cccccc !important;
    }
    
    body.dark-mode .text-gray-500 {
      color: #aaaaaa !important;
    }
    
    body.dark-mode .border-gray-100,
    body.dark-mode .border-gray-200,
    body.dark-mode .border-gray-300 {
      border-color: #3a3a3a !important;
    }
    
    body.dark-mode .bg-gray-50,
    body.dark-mode .bg-gray-100 {
      background-color: #333333 !important;
    }
    
    body.dark-mode .hover\\:bg-gray-50:hover {
      background-color: #3a3a3a !important;
    }
    
    body.dark-mode .shadow-sm,
    body.dark-mode .shadow-md,
    body.dark-mode .shadow-lg {
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px 0 rgba(0, 0, 0, 0.4) !important;
    }
    
    body.dark-mode input,
    body.dark-mode textarea,
    body.dark-mode select {
      background-color: #333 !important;
      color: #fff !important;
      border-color: #555 !important;
    }
    
    body.dark-mode input::placeholder,
    body.dark-mode textarea::placeholder {
      color: #999 !important;
    }
    
    body.dark-mode .modal,
    body.dark-mode .dropdown-menu {
      background-color: #2a2a2a !important;
      border-color: #444 !important;
    }
  `;
  return styleElement;
};

interface ThemeContextType {
  theme: string;
  toggleTheme: () => void;
  setTheme: (theme: string) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
  setTheme: () => {},
});

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    const savedTheme = localStorage.getItem('userPreferences');
    if (savedTheme) {
      try {
        const preferences = JSON.parse(savedTheme);
        return preferences.theme || 'light';
      } catch (e) {
        return 'light';
      }
    }
    return 'light';
  });

  // Inject dark mode styles on component mount
  useEffect(() => {
    let styleElement = document.getElementById('dark-mode-styles');
    if (!styleElement) {
      styleElement = createDarkModeStyles();
      document.head.appendChild(styleElement);
    }
    
    // Apply theme on initial load
    applyTheme(theme);

    // Cleanup on unmount
    return () => {
      if (styleElement && styleElement.parentNode) {
        styleElement.parentNode.removeChild(styleElement);
      }
    };
  }, []);

  // Apply theme whenever it changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const applyTheme = (themeMode: string) => {
    if (themeMode === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark-mode');
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const setTheme = (newTheme: string) => {
    setThemeState(newTheme);
    
    // Lưu theme vào localStorage
    const savedPreferences = localStorage.getItem('userPreferences');
    let preferences = savedPreferences ? JSON.parse(savedPreferences) : {};
    preferences.theme = newTheme;
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 