import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import AuthService from "../services/AuthService";

function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState("");
  const [invalidToken, setInvalidToken] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);

  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const resetToken = searchParams.get("token");
    if (!resetToken) {
      setInvalidToken(true);
    } else {
      setToken(resetToken);
    }
  }, [searchParams]);

  useEffect(() => {
    if (resetSuccess && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (countdown === 0) navigate("/login");
  }, [resetSuccess, countdown, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Minimum 6 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      await AuthService.resetPassword(token, formData.password);
      setResetSuccess(true);
    } catch (err) {
      alert("Reset failed");
    } finally {
      setLoading(false);
    }
  };

  if (invalidToken) {
    return (
      <div className="text-center mt-20">
        <h1>Invalid or Expired Token</h1>
        <Link to="/login">Back to Login</Link>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded shadow w-96">
        {resetSuccess ? (
          <div className="text-center">
            <h2>Password Changed Successfully</h2>
            <p>Redirecting in {countdown} seconds...</p>
            <button onClick={() => navigate("/login")}>Login Now</button>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-4 text-center">
              Create New Password
            </h2>
            <form onSubmit={handleSubmit}>
              {/* NEW PASSWORD */}
              <div className="mb-4 relative">
                <input
                  type={showNew ? "text" : "password"}
                  name="password"
                  placeholder="New Password"
                  value={formData.password}
                  onChange={handleChange}
                  className="border p-2 w-full"
                />
                <span
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-2 cursor-pointer"
                >
                  {showNew ? "🙈" : "👁"}
                </span>
                {errors.password && (
                  <p className="text-red-500">{errors.password}</p>
                )}
              </div>
              {/* CONFIRM PASSWORD */}
              <div className="mb-4 relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="border p-2 w-full"
                />
                <span
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-2 cursor-pointer"
                >
                  {showConfirm ? "🙈" : "👁"}
                </span>
                {errors.confirmPassword && (
                  <p className="text-red-500">{errors.confirmPassword}</p>
                )}
              </div>
              <button
                disabled={loading}
                className="bg-green-600 text-white w-full p-2 rounded"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
            <div className="text-center mt-4">
              <Link to="/login">Back to Login</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ResetPassword;
