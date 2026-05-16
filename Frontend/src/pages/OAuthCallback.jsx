import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import api from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      navigate("/login?error=oauth");
      return;
    }

    // Set token and fetch user
    localStorage.setItem("token", token);
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    api
      .get("/auth/me")
      .then(({ data }) => {
        login(token, data.user);
        navigate("/");
      })
      .catch(() => {
        navigate("/login?error=oauth");
      });
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-dark-300 gap-4">
      <LoadingSpinner size="lg" />
      <p className="text-gray-400">Completing sign in...</p>
    </div>
  );
}
