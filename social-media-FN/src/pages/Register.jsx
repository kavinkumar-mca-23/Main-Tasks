import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

const Register = () => {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(name, email, password);
      navigate("/login");
    } catch (err) {
      alert("Register failed: " + (err.response?.data?.message || "Server error"));
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md transition-all hover:scale-[1.02]"
      >
        <h2 className="text-2xl font-semibold text-center mb-6 text-blue-600">Register </h2>
        <input
          className="w-full mb-4 px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
        />
        <input
          className="w-full mb-4 px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email: example@gmail.com"
        />
        <input
          className="w-full mb-4 px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="min 4 Characters"
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Register
        </button>

        <p className="mt-4 text-sm text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 hover:underline">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Register;
