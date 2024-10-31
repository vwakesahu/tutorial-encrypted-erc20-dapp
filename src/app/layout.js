import localFont from "next/font/local";
import "./globals.css";
import PrivyWrapper from "@/privy/privyProvider";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata = {
  title: "Tutorial | Encrypted ERC-20 | FHEVM",
  description:
    "Tutorial on how to mint an encrypted ERC-20 token using FHEVM and how to re-encrypt it.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PrivyWrapper>{children}</PrivyWrapper>
      </body>
    </html>
  );
}
