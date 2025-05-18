import { BrowserRouter as Router } from 'react-router-dom';
import AppRouter from "../src/routes/index";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { DataPrefetcher } from './components/DataPrefetcher';
import FeedbackHandler from './components/FeedbackHandler';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';

function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <Router>
          <DataPrefetcher>
            <AppRouter />
            <ToastContainer position="top-right" autoClose={3000} />
            <ToastContainer 
              position="bottom-left" 
              autoClose={5000} 
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              containerId="event-notifications"
              style={{ width: "auto", maxWidth: "420px" }}
            />
            <FeedbackHandler />
          </DataPrefetcher>
        </Router>
      </ThemeProvider>
    </LanguageProvider>
  );
}

export default App;
