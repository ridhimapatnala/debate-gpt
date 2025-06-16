import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Debate from './pages/Debate';
import History from './pages/History';
import AuthPage from './pages/AuthPage';
import { useState } from 'react';

function App() {
  const [isAuthenticated, setIsAuthenticated]=useState(false);
  const [user, setUser]=useState(null);
  return (
    <Router>
      <div className="min-h-screen bg-gray-100 text-gray-900">
        <Navbar 
          isAuthenticated={isAuthenticated}
          setIsAuthenticated={setIsAuthenticated}
        />
        <main className="p-6">
          <Routes>
            <Route path="/" element={<AuthPage 
                                        setUser={setUser}
                                        setIsAuthenticated={setIsAuthenticated}/>
                                    } />
            <Route path="/debate" element={<Debate />} />
            <Route path="/history" element={<History />} />
            <Route path="/home" element={<Home />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
