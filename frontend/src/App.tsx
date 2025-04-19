import { BrowserRouter as Router } from 'react-router-dom';
import AppRouter from "../src/routes/index";

function App() {
  return (
    <Router>
      <AppRouter />
    </Router>
  );
}

export default App;
