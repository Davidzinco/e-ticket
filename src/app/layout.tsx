import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ViewTransitions } from "next-view-transitions";
import PageWrapper from "./components/layouts/transition/transition";
import { getServerSession } from "next-auth";
import Providers from "./components/layouts/Providers/Providers";
import { authOptions } from "@/libs/auth/auth";
import { Toaster } from "@/components/ui/sonner";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bhimacrew | E-Ticket",
  description: "Official E-Ticket Platform for Bhima Night Carnival",
  icons: {
    icon: "/images/smasa.ico",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const hasAuthConfig =
    process.env.NEXTAUTH_SECRET &&
    process.env.GOOGLE_OAUTH_CLIENT_ID &&
    process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const session = hasAuthConfig ? await getServerSession(authOptions) : null;
  return (
    <ViewTransitions>
      <html lang="en">
        <body className={`${plusJakartaSans.className} bg-[#0b1c30] text-[#f8f9ff] selection:bg-[#4f46e5] selection:text-white min-h-screen font-sans`}>
          <Toaster richColors position="top-center" />
          <Providers session={session}>
            <PageWrapper>{children}</PageWrapper>
          </Providers>
        </body>
      </html>
    </ViewTransitions>
  );
}
