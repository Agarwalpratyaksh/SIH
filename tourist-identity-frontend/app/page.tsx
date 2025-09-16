// app/page.tsx
"use client";

import { useState } from "react";
import { RegisterForm } from "@/components/RegisterForm";
import { Header } from "@/components/Header";
import { VerifyRecord } from "@/components/VerifyRecord";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, ScanSearch, ArrowLeft } from "lucide-react";

type View = "home" | "register" | "verify";

export default function Home() {
  const [view, setView] = useState<View>("home");

  const renderContent = () => {
    switch (view) {
      case "register":
        return <RegisterForm />;
      case "verify":
        return <VerifyRecord />;
      default:
        return <HomeSelection onSelect={setView} />;
    }
  };

  return (
    <div className="min-h-screen bg-black/10 text-white">
      <Header />
      <main className="container mx-auto flex flex-col items-center p-4 pt-10">
        {view !== "home" && (
          <motion.button
            onClick={() => setView("home")}
            className="flex items-center gap-2 self-start mb-8 text-slate-300 hover:text-white transition-colors"
            whileHover={{ x: -5 }}
          >
            <ArrowLeft size={20} />
            Back to Home
          </motion.button>
        )}
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

// A new component for the home screen selection cards
function HomeSelection({ onSelect }: { onSelect: (view: View) => void }) {
  const cardVariants = {
    hover: {
      y: -10,
      boxShadow: "0px 20px 30px rgba(0, 0, 0, 0.25)",
      borderColor: "rgba(168, 85, 247, 0.8)",
    },
  };

  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-8 mt-16">
      <motion.div
        className="flex flex-col items-center justify-center p-10 w-80 h-80 cursor-pointer bg-slate-900/50 border-2 border-slate-700 rounded-2xl text-center"
        onClick={() => onSelect("register")}
        variants={cardVariants}
        whileHover="hover"
        transition={{ type: "spring", stiffness: 300 }}
      >
        <UserPlus className="w-20 h-20 mb-6 text-purple-400" />
        <h2 className="text-3xl font-bold">Register User</h2>
        <p className="mt-2 text-slate-400">
          Create a new identity record for a tourist on the Solana blockchain.
        </p>
      </motion.div>

      <motion.div
        className="flex flex-col items-center justify-center p-10 w-80 h-80 cursor-pointer bg-slate-900/50 border-2 border-slate-700 rounded-2xl text-center"
        onClick={() => onSelect("verify")}
        variants={cardVariants}
        whileHover="hover"
        transition={{ type: "spring", stiffness: 300 }}
      >
        <ScanSearch className="w-20 h-20 mb-6 text-green-400" />
        <h2 className="text-3xl font-bold">Verify Record</h2>
        <p className="mt-2 text-slate-400">
          Fetch and decrypt a tourists data using their public key.
        </p>
      </motion.div>
    </div>
  );
}