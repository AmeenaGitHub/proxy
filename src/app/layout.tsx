import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Proximo. — District Blood Donor Matching",
  description:
    "Smart, private blood donor matching for Ernakulam district. Find compatible donors near you without exposing personal data.",
  keywords: ["blood donation", "donor matching", "Ernakulam", "Kerala", "blood bank"],
  openGraph: {
    title: "Proximo. — District Blood Donor Matching",
    description: "Smart, private blood donor matching for your district.",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
