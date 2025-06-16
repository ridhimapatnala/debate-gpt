import { Link } from 'react-router-dom';

const Navbar = ({isAuthenticated, setIsAuthenticated}) => {
  const handleLogout=()=>{
    setIsAuthenticated(false);
    localStorage.removeItem("token")
  }
  return (
    <nav className="bg-gray-900 text-white px-6 py-4 shadow-md flex justify-between items-center">
      <h1 className="text-2xl font-bold">
        <Link to="/home">DebateGPT</Link>
      </h1>
      <div className="space-x-4">
        <Link to="/home" className="hover:text-blue-400 transition">Home</Link>
        {!isAuthenticated && (
          <Link to="/" className="hover:text-blue-400 transition">Login</Link>
        )}
        {isAuthenticated && (
          <>
            <Link to="/debate" className="hover:text-blue-400 transition">Debate</Link>
            <Link to="/history" className="hover:text-blue-400 transition">History</Link>
            <Link to="/" className="hover:text-blue-400 transition" onClick={handleLogout}>Logout</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
