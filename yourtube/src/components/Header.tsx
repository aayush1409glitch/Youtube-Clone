import { Bell, Menu, Mic, Search, User, VideoIcon, Moon, Sun } from "lucide-react";
import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import Link from "next/link";
import { Input } from "./ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import Channeldialogue from "./channeldialogue";
import { useRouter } from "next/router";
import { useUser } from "@/lib/AuthContext";
import OtpModal from "./OtpModal";
import axiosInstance from "@/lib/axiosinstance";

const Header = () => {
  const { user, setUser, logout, handlegooglesignin, channels, activeChannel, switchChannel, toggleSidebar } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [isdialogeopen, setisdialogeopen] = useState(false);
  const [theme, setTheme] = useState("dark"); // Default for SSR
  const router = useRouter();

  // Sync state with DOM theme
  useEffect(() => {
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
    
    // Observer to detect class changes if something else changes it
    const observer = new MutationObserver(() => {
      setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const toggleTheme = async () => {
    const isDark = document.documentElement.classList.contains("dark");
    const newTheme = isDark ? "light" : "dark";
    
    document.documentElement.classList.toggle("dark", !isDark);
    document.documentElement.classList.toggle("light", isDark);
    setTheme(newTheme);

    if (user) {
      try {
        await axiosInstance.post("/user/update-theme", { userId: user._id, theme: newTheme });
        const updatedUser = { ...user, theme: newTheme };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      } catch (e) {
        console.error("Failed to update theme", e);
      }
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };
  const handleKeypress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch(e as any);
    }
  };
  return (
    <header className="flex items-center justify-between px-2 sm:px-4 py-2 bg-white dark:bg-zinc-900 border-b dark:border-zinc-800 gap-1 sm:gap-4">
      <div className="flex items-center gap-1 sm:gap-4 shrink-0">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="dark:text-white h-9 w-9">
          <Menu className="w-5 h-5" />
        </Button>
        <Link href="/" className="flex items-center gap-1">
          <div className="bg-red-600 p-1 rounded">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          </div>
          <span className="text-lg sm:text-xl font-medium dark:text-white hidden sm:inline">YourTube</span>
        </Link>
      </div>
      <form
        onSubmit={handleSearch}
        className="flex items-center gap-1 flex-1 max-w-2xl mx-1 sm:mx-4"
      >
        <div className="flex flex-1">
          <Input
            type="search"
            placeholder="Search"
            value={searchQuery}
            onKeyPress={handleKeypress}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-l-full border-r-0 text-xs sm:text-sm h-9 px-3 focus-visible:ring-0 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
          />
          <Button
            type="submit"
            className="rounded-r-full h-9 px-3 sm:px-6 bg-gray-50 hover:bg-gray-100 text-gray-600 border border-l-0 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:border-zinc-700 dark:text-gray-300"
          >
            <Search className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>
      </form>
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="dark:text-white h-9 w-9">
          {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>
        {user ? (
          <>
            <Button variant="ghost" size="icon" className="dark:text-white">
              <VideoIcon className="w-6 h-6" />
            </Button>
            <Button variant="ghost" size="icon" className="dark:text-white">
              <Bell className="w-6 h-6" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={activeChannel ? activeChannel.avatar : user.image} />
                    <AvatarFallback>{activeChannel ? activeChannel.channelname?.[0] : (user.name?.[0] || "U")}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white" align="end" forceMount>
                <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Your Channels
                </div>
                {channels && channels.length > 0 ? (
                  channels.map((channel: any) => (
                    <DropdownMenuItem
                      key={channel._id}
                      onClick={() => switchChannel(channel)}
                      className={`cursor-pointer dark:hover:bg-zinc-700 ${activeChannel?._id === channel._id ? 'bg-gray-100 dark:bg-zinc-700 font-bold' : ''}`}
                    >
                      <Link href={`/channel/${channel._id}`} className="flex items-center w-full">
                        <Avatar className="h-5 w-5 mr-2">
                          <AvatarFallback>{channel.channelname[0]}</AvatarFallback>
                        </Avatar>
                        {channel.channelname}
                      </Link>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <div className="px-2 py-1 text-sm text-gray-500 dark:text-gray-400">No channels yet</div>
                )}
                
                <DropdownMenuSeparator className="dark:bg-zinc-700" />
                
                <div className="px-2 py-1.5">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full dark:bg-zinc-700 dark:text-white dark:hover:bg-zinc-600"
                    onClick={() => setisdialogeopen(true)}
                  >
                    + Create New Channel
                  </Button>
                </div>
                <DropdownMenuItem asChild className="cursor-pointer dark:hover:bg-zinc-700">
                  <Link href="/history">History</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer dark:hover:bg-zinc-700">
                  <Link href="/liked">Liked videos</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer dark:hover:bg-zinc-700">
                  <Link href="/watch-later">Watch later</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="dark:bg-zinc-700" />
                <DropdownMenuItem onClick={logout} className="cursor-pointer dark:hover:bg-zinc-700">Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <>
            <Button
              className="flex items-center gap-2 dark:bg-red-600 dark:text-white dark:hover:bg-red-700"
              onClick={handlegooglesignin}
            >
              <User className="w-4 h-4" />
              Sign in
            </Button>
          </>
        )}{" "}
      </div>
      <Channeldialogue
        isopen={isdialogeopen}
        onclose={() => setisdialogeopen(false)}
        mode="create"
      />
      <OtpModal />
    </header>
  );
};

export default Header;
