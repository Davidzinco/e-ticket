import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ViewTransitions } from "next-view-transitions";
import PageWrapper from "./components/layouts/transition/transition";
import { getServerSession } from "next-auth";
import Providers from "./components/layouts/Providers/Providers";
import { authOptions } from "@/libs/auth/auth";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bhimacrew",
  description: "E-Ticket by Bhimacrew",
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
        <body className={`${inter.variable} bg-black`}>
          <Toaster richColors position="top-center" />
          <Providers session={session}>
            <PageWrapper>{children}</PageWrapper>
          </Providers>
        </body>
      </html>
    </ViewTransitions>
  );
}
