import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#364253] w-full min-h-[87.3vh] flex items-center justify-center py-16">
      <form
        onSubmit={handleSubmit}
        className="bg-[#1D84B5] flex flex-col gap-5 p-10 w-full max-w-md"
      >
        <p className="text-white text-3xl font-semibold text-center mb-3">
          LOGIN
        </p>

        {error && (
          <p className="text-white bg-red-600 text-sm text-center py-2 px-3">
            {error}
          </p>
        )}

        <div className="w-full flex flex-col gap-2 justify-center items-start">
          <p className="text-[#364355] text-sm">Email</p>
          <input
            type="email"
            required
            className="bg-[#303B4B] px-5 py-3 w-full outline-none text-white"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>

        <div className="w-full flex flex-col gap-2 justify-center items-start">
          <p className="text-[#364355] text-sm">Password</p>
          <input
            type="password"
            required
            className="bg-[#303B4B] px-5 py-3 w-full outline-none text-white"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="bg-[#364253] text-white px-8 py-3 mt-5 text-lg disabled:opacity-60"
        >
          {submitting ? "LOGGING IN..." : "LOGIN"}
        </button>

        <p className="text-white text-sm text-center">
          Don't have an account?{" "}
          <Link to="/signup" className="underline font-semibold">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Login;
