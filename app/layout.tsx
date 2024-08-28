import "./globals.css";
import Navbar from "./components/Navbar";
import { Metadata } from "next";
import Script from "next/script";


export const metadata: Metadata = {
  title: "Bhishman's Blog",
  description: "Created by Bhishman Desai",
  verification: {
    google: process.env.GOOGLE_SEARCH_CONSOLE_TOKEN
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
        <head>
            <Script
                async
                src="https://www.googletagmanager.com/gtag/js?id=G-6V5PRQ47BR"
            ></Script>
            <Script id="google-analytics">
                {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                
                gtag('config', 'G-6V5PRQ47BR');
              `}
            </Script>
        </head>
        <body className="dark:bg-slate-800">
            <Navbar/>
            <main className="px-4 md:px-6 prose prose-xl prose-slate dark:prose-invert mx-auto">
                {children}
            </main>
        </body>
    </html>
  );
}
