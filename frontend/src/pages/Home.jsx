import {Link} from "react-router-dom";
const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
        <h2 className="text-4xl font-bold mb-4 text-center">Welcome to DebateGPT</h2>
        <p className="text-lg text-gray-600 mb-8 text-center max-w-xl">
            Start a debate and sharpen your argument skills.
        </p>
        <Link
            to="/debate"
            className="text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded transition"
        >
            Click to start a debate!
        </Link>
    </div>

  );
};

export default Home;





