import { BrowserRouter as Router } from 'react-router-dom';
import AppRouter from "../src/routes/index";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <Router>
      <AppRouter />
      <ToastContainer position="top-right" autoClose={3000} />
    </Router>
  );
}

export default App;
