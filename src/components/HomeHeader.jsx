import { Link, useNavigate } from "react-router-dom";

export default function HomeHeader({ onSupport }) {
  const navigate = useNavigate();

  return (
    <header className="mb-8 flex items-center justify-between">
      <div>
        <Link to="/" className="text-2xl font-bold">
          FarmEazy
        </Link>
        <p className="text-sm text-muted-foreground">Smart Farm Management</p>
      </div>

      <nav className="flex items-center gap-4 text-sm">
        <Link to="/" className="hover:underline">
          Home
        </Link>
        <Link to="/farms" className="hover:underline">
          Farms
        </Link>
        <Link to="/dashboard" className="hover:underline">
          Dashboard
        </Link>
        <button onClick={onSupport} className="text-blue-600 hover:underline">
          Support
        </button>
        <button
          onClick={() => navigate("/cart")}
          className="rounded-md bg-orange-500 px-3 py-1 text-white hover:bg-orange-600"
        >
          Cart
        </button>
      </nav>
    </header>
  );
}
