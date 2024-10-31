"use client";

import NotConnected from "@/components/not-connected";
import { Source_Code_Pro } from "next/font/google";
import React from "react";
import Connected from "@/components/connected";
import { usePrivy } from "@privy-io/react-auth";

const sourceCodePro = Source_Code_Pro({
  subsets: ["latin"],
  display: "swap",
});

const HomeContent = () => {
  const { authenticated: isConnected } = usePrivy();

  return isConnected ? <Connected /> : <NotConnected />;
};

const Home = () => {
  return (
    <div className={sourceCodePro.className}>
      <HomeContent />
    </div>
  );
};

export default Home;
