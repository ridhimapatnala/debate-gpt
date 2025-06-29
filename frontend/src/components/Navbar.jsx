import { Link, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';

const Navbar = ({ isAuthenticated, setIsAuthenticated }) => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleLogout = () => {
    setDropdownOpen(false);
    setIsAuthenticated(false);
    localStorage.removeItem("token");
    navigate('/');
  };

  return (
    <nav className="bg-navy text-cream px-6 py-4 shadow-md flex justify-between items-center">
      <h1 className="text-2xl font-bold">
        <Link to="/home" className="text-blue hover:text-cream transition">DebateGPT</Link>
      </h1>
      <div className="space-x-4 relative">
        <Link to="/home" className="hover:text-blue transition">Home</Link>
        {!isAuthenticated && (
          <Link to="/" className="hover:text-blue transition">Login</Link>
        )}
        {isAuthenticated && (
          <div className="inline-block relative" ref={dropdownRef}>
            <button
              className="hover:text-blue transition"
              onClick={() => setDropdownOpen((open) => !open)}
            >
              Your Account
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-cream text-navy border rounded shadow-lg z-10">
                <Link
                  to="/history"
                  className="block px-4 py-2 hover:bg-blue hover:text-cream rounded-t"
                  onClick={() => setDropdownOpen(false)}
                >
                  History
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 hover:bg-red hover:text-cream text-red rounded-b"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;