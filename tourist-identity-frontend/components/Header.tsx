// components/Header.tsx
"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { ShieldCheck } from 'lucide-react';

export function Header() {
    return (
        <header className="sticky top-0 z-50 w-full p-4 bg-slate-900/50 backdrop-blur-lg border-b border-slate-700">
            <div className="container mx-auto flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <ShieldCheck className="w-8 h-8 text-purple-400" />
                    <h1 className="text-2xl font-bold text-slate-100">
                        Tourist Identity System
                    </h1>
                </div>
                <WalletMultiButton className="wallet-adapter-button-trigger" />
            </div>
        </header>
    );
}