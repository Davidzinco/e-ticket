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
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=Literata:ital,opsz,wght@0,7..72,200..900;1,7..72,200..900&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap" rel="stylesheet" />
          <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        </head>
        <body className={`${plusJakartaSans.className} bg-background text-on-background selection:bg-primary-container selection:text-on-primary-container min-h-screen font-sans`}>
          <Toaster richColors position="top-center" />
          <Providers session={session}>
            <PageWrapper>{children}</PageWrapper>
          </Providers>
        </body>
      </html>
    </ViewTransitions>
  );
}
