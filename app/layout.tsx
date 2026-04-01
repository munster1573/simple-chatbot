import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Simple Chatbot",
  description: "A simple chatbot with Next.js and OpenAI"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
