import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { Toaster } from "@/components/ui/sonner";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { UserProvider } from "../lib/AuthContext";
import Head from "next/head";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <UserProvider>
      <Head>
        <title>YourTube Clone</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
        <Header />
        <Toaster />
        <div className="flex">
          <Sidebar />
          <div className="flex-1 min-w-0">
            <Component {...pageProps} />
          </div>
        </div>
      </div>
    </UserProvider>
  );
}
