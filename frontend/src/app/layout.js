import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import Navbar from "@/components/layout/Navbar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "GSTU CSE 10th Batch Portal",
  description: "Official Academic and Batch Portal for GSTU CSE 10th Batch",
  icons: {
    icon: "/images/branding/favicon.png",
    shortcut: "/images/branding/favicon.png",
    apple: "/images/branding/favicon.png",
  },
};

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const userCookie = cookieStore.get("auth_user_min")?.value;
  let initialUser = null;
  if (userCookie) {
    try {
      initialUser = JSON.parse(decodeURIComponent(userCookie));
    } catch {}
  }

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Caveat:wght@700&family=EB+Garamond:ital,wght@0,400..700;1,400..700&family=Pinyon+Script&family=UnifrakturCook:wght@700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#f8fafc]">
        {/* গ্লোবাল পারসিস্টেন্ট হেডার (নেভিগেশনে আনমাউন্ট হবে না, জিরো ফ্লিকার) */}
        <Navbar initialUser={initialUser} />
        {children}
      </body>
    </html>
  );
}
