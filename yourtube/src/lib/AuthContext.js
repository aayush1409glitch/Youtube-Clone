import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { useState } from "react";
import { createContext } from "react";
import { provider, auth } from "./firebase";
import axiosInstance from "./axiosinstance";
import { useEffect, useContext } from "react";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [otpData, setOtpData] = useState({ email: "", showModal: false });

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const loadChannels = async (userId) => {
    try {
      const res = await axiosInstance.get(`/channel/user/${userId}`);
      setChannels(res.data);
      if (res.data.length > 0) {
        setActiveChannel(res.data[0]);
      }
    } catch (err) {
      console.error("Error loading channels:", err);
    }
  };

  const login = async (userdata) => {
    // If it's returning OTP required
    if (userdata.requiresOTP) {
      setOtpData({ email: userdata.email, showModal: true });
      return;
    }
    setUser(userdata);
    localStorage.setItem("user", JSON.stringify(userdata));
    if (userdata.theme) {
      document.documentElement.classList.toggle("dark", userdata.theme === "dark");
      document.documentElement.classList.toggle("light", userdata.theme === "light");
    }
    await loadChannels(userdata._id);
  };
  const logout = async () => {
    setUser(null);
    setChannels([]);
    setActiveChannel(null);
    localStorage.removeItem("user");
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error during sign out:", error);
    }
  };

  const getDeviceFootprint = () => {
    return navigator.userAgent;
  };

  const handlegooglesignin = async () => {
    try {
      // Just trigger Firebase sign in. The onAuthStateChanged listener will handle the backend login call.
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error(error);
    }
  };
  useEffect(() => {
    const unsubcribe = onAuthStateChanged(auth, async (firebaseuser) => {
      if (firebaseuser) {
        try {
          // Check if already logged in via context
          if (user) return;
          const payload = {
            email: firebaseuser.email,
            name: firebaseuser.displayName,
            image: firebaseuser.photoURL || "https://github.com/shadcn.png",
            deviceFootprint: getDeviceFootprint()
          };
          const response = await axiosInstance.post("/user/login", payload);
          if (response.status === 202 && response.data.requiresOTP) {
            setOtpData({ email: response.data.email, locationString: response.data.locationString, showModal: true });
          } else {
            await login(response.data.result);
          }
        } catch (error) {
          console.error(error);
          logout();
        }
      }
    });
    return () => unsubcribe();
  }, [user]);

  const verifyOtp = async (otpCode) => {
    try {
      const response = await axiosInstance.post("/user/verify-otp", {
        email: otpData.email,
        otp: otpCode,
        deviceFootprint: getDeviceFootprint(),
        locationString: otpData.locationString
      });
      setOtpData({ email: "", locationString: "", showModal: false });
      await login(response.data.result);
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const switchChannel = (channel) => {
    setActiveChannel(channel);
  };

  return (
    <UserContext.Provider value={{ user, setUser, login, logout, handlegooglesignin, channels, activeChannel, switchChannel, loadChannels, isSidebarOpen, toggleSidebar, otpData, setOtpData, verifyOtp }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
