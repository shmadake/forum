import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import { useAuth } from "../context/AuthContext";

const initials = (name = "") =>
  name
    .trim()
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const Avatar = ({ name, size = "h-12 w-12" }) => (
  <div
    className={`${size} rounded-full bg-[#1D84B5] text-white flex items-center justify-center font-semibold`}
  >
    {initials(name)}
  </div>
);

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [modal, setModal] = useState(false);

  const handleLogout = async () => {
    await logout();
    setModal(false);
    navigate("/");
  };

  return (
    <div className="bg-[#364253] flex flex-row justify-between items-center text-white md:px-10 px-5 py-5">
      {modal && (
        <div className="fixed flex justify-center items-center inset-0 text-white bg-slate-700 bg-opacity-30">
          <div className="flex flex-col bg-[#364253] items-end gap-5 justify-center">
            <div className="flex items-center justify-center">
              <button
                onClick={() => setModal(false)}
                className="bg-red-600 p-2"
              >
                <CloseIcon />
              </button>
            </div>
            <div className="flex flex-col gap-5 pb-10 px-20 justify-center items-center">
              <p className="text-lg">{user && user.email}</p>
              <Avatar name={user?.name} size="h-20 w-20" />
              <p className="text-xl">Hi, {user && user.name}!</p>
              <button
                className="md:text-lg bg-[#1D84B5] md:px-5 px-3 md:py-3 py-2"
                onClick={handleLogout}
              >
                LOGOUT
              </button>
            </div>
          </div>
        </div>
      )}

      <div>
        <Link to="/" className="md:text-4xl text-xl font-semibold italic">
          AISSMS FORUM
        </Link>
      </div>
      <div className="flex flex-row md:gap-10 gap-5 items-center">
        {isAuthenticated && (
          <>
            <Link className="md:text-lg" to="/posts">
              POSTS
            </Link>
            <button
              onClick={() => setModal(true)}
              className="h-12 w-12 overflow-hidden rounded-full"
            >
              <Avatar name={user?.name} />
            </button>
          </>
        )}
        {!isAuthenticated && (
          <Link
            to="/login"
            className="md:text-lg bg-[#1D84B5] md:px-5 px-3 md:py-3 py-2"
          >
            LOGIN
          </Link>
        )}
      </div>
    </div>
  );
};

export default Navbar;
