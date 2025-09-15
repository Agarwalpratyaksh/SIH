// components/RegisterForm.tsx
"use client";

import { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { Keypair, SystemProgram, PublicKey } from '@solana/web3.js';
import CryptoJS from 'crypto-js';
import idl from '../idl/tourist_identity.json';
import { BN } from 'bn.js';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle, AlertTriangle, Copy } from 'lucide-react';

const AES_SECRET_KEY = 'your-super-secret-key-for-encryption';
const PROGRAM_ID = new PublicKey("HMGBqpGvQyNicSDmHk8WCDQnm1LAXgFsLMEtEhxQAauU");

type TouristFormData = {
  name: string;
  aadhaar: string;
  passport: string;
  itinerary: { arrival: string; destination: string; duration_days: number; };
  emergency_contact: { name: string; phone: string; };
};

const initialState: TouristFormData = {
  name: "", aadhaar: "", passport: "",
  itinerary: { arrival: "", destination: "", duration_days: 10 },
  emergency_contact: { name: "", phone: "" },
};

export function RegisterForm() {
  const [formData, setFormData] = useState<TouristFormData>(initialState);
  const [status, setStatus] = useState({ message: '', type: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [newRecordPubKey, setNewRecordPubKey] = useState("");

  const { connection } = useConnection();
  const wallet = useWallet();

  const getProvider = () => {
    if (!wallet || !wallet.publicKey) throw new Error("Wallet not connected");
    // @ts-ignore
    return new AnchorProvider(connection, wallet, AnchorProvider.defaultOptions());
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const [section, field] = name.split('.');

    if (field && (section === 'itinerary' || section === 'emergency_contact')) {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: section === 'itinerary' && field === 'duration_days' ? Number(value) : value,
        },
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!wallet.publicKey) {
      setStatus({ message: "Please connect your wallet first!", type: 'error' });
      return;
    }
    setIsLoading(true);
    setStatus({ message: 'Processing...', type: 'loading' });
    setNewRecordPubKey('');

    try {
      const touristDataString = JSON.stringify(formData);
      
      setStatus({ message: 'Encrypting data...', type: 'loading' });
      const encryptedData = CryptoJS.AES.encrypt(touristDataString, AES_SECRET_KEY).toString();

      setStatus({ message: 'Uploading to IPFS...', type: 'loading' });
      const response = await fetch('/api/uploadToPinata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ encryptedData }),
      });
      const { ipfsCid, error } = await response.json();
      if (!response.ok) throw new Error(error || 'Failed to upload to IPFS');

      setStatus({ message: 'Computing hash...', type: 'loading' });
      const hashWordArray = CryptoJS.SHA256(encryptedData);
      const dataHash = Array.from(Buffer.from(hashWordArray.toString(CryptoJS.enc.Hex), 'hex'));
      
      setStatus({ message: 'Sending transaction to Solana...', type: 'loading' });
      const provider = getProvider();
      const program = new Program(idl as any, provider);
      
      const touristRecord = Keypair.generate();
      setNewRecordPubKey(touristRecord.publicKey.toBase58());

      const issuedAt = Math.floor(Date.now() / 1000);
      const validity = formData.itinerary.duration_days * 24 * 60 * 60;

      const tx = await program.methods
        .registerTourist(dataHash, ipfsCid, new BN(issuedAt), new BN(validity))
        .accounts({
          touristRecord: touristRecord.publicKey,
          authority: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([touristRecord])
        .rpc();

      setStatus({ message: `Success! Transaction: ${tx}`, type: 'success' });
      setFormData(initialState);
      
    } catch (error) {
      console.error(error);
      setStatus({ message: `Error: ${(error as Error).message}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = "w-full p-3 bg-slate-800 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition";
  const fieldsetVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <div className="flex flex-col gap-6 p-8 border border-slate-700 bg-slate-900/50 backdrop-blur-sm rounded-2xl max-w-2xl mx-auto shadow-2xl shadow-purple-900/10">
      <h2 className="text-3xl font-bold text-center">Register New Tourist</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <motion.fieldset variants={fieldsetVariants} initial="hidden" animate="visible" transition={{ delay: 0.1 }} className="flex flex-col gap-4 p-4 border border-slate-700 rounded-lg">
          <legend className="px-2 font-semibold text-purple-400">Personal Details</legend>
          <input className={inputClass} type="text" name="name" placeholder="Name" value={formData.name} onChange={handleChange} required />
          <input className={inputClass} type="text" name="passport" placeholder="Passport Number" value={formData.passport} onChange={handleChange} required />
          <input className={inputClass} type="text" name="aadhaar" placeholder="Aadhaar Number" value={formData.aadhaar} onChange={handleChange} required />
        </motion.fieldset>

        <motion.fieldset variants={fieldsetVariants} initial="hidden" animate="visible" transition={{ delay: 0.2 }} className="flex flex-col gap-4 p-4 border border-slate-700 rounded-lg">
          <legend className="px-2 font-semibold text-purple-400">Itinerary</legend>
          <input className={inputClass} type="text" name="itinerary.destination" placeholder="Destination(s)" value={formData.itinerary.destination} onChange={handleChange} required />
          <label className="text-sm text-slate-400">Arrival Date:</label>
          <input className={inputClass} type="date" name="itinerary.arrival" value={formData.itinerary.arrival} onChange={handleChange} required />
          <label className="text-sm text-slate-400">Duration (days):</label>
          <input className={inputClass} type="number" name="itinerary.duration_days" value={formData.itinerary.duration_days} onChange={handleChange} required />
        </motion.fieldset>

        <motion.fieldset variants={fieldsetVariants} initial="hidden" animate="visible" transition={{ delay: 0.3 }} className="flex flex-col gap-4 p-4 border border-slate-700 rounded-lg">
          <legend className="px-2 font-semibold text-purple-400">Emergency Contact</legend>
          <input className={inputClass} type="text" name="emergency_contact.name" placeholder="Contact Name" value={formData.emergency_contact.name} onChange={handleChange} required />
          <input className={inputClass} type="tel" name="emergency_contact.phone" placeholder="Contact Phone" value={formData.emergency_contact.phone} onChange={handleChange} required />
        </motion.fieldset>

        <motion.button 
            type="submit" 
            className="flex items-center justify-center gap-2 w-full bg-purple-600 text-white p-3 font-bold rounded-lg hover:bg-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-300" 
            disabled={isLoading || !wallet.publicKey}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
        >
            {isLoading ? <><Loader2 className="animate-spin" /> Registering...</> : 'Register Tourist'}
        </motion.button>
      </form>

      {status.message && (
        <div className={`mt-4 text-center p-3 rounded-lg flex items-center justify-center gap-2
          ${status.type === 'success' ? 'bg-green-500/20 text-green-300' : ''}
          ${status.type === 'error' ? 'bg-red-500/20 text-red-300' : ''}
          ${status.type === 'loading' ? 'bg-slate-700/50 text-slate-300' : ''}
        `}>
          {status.type === 'success' && <CheckCircle size={20} />}
          {status.type === 'error' && <AlertTriangle size={20} />}
          {status.type === 'loading' && <Loader2 size={20} className="animate-spin" />}
          <p className="text-sm">{status.message}</p>
        </div>
      )}

      {newRecordPubKey && (
        <div className="mt-4 p-4 bg-slate-800 rounded-lg text-center">
            <h3 className="font-bold text-md">New Record Public Key:</h3>
            <div className="flex items-center justify-center gap-3 mt-2 p-2 bg-slate-900 rounded-md">
                <code className="text-sm text-purple-300 break-all">{newRecordPubKey}</code>
                <button onClick={() => navigator.clipboard.writeText(newRecordPubKey)} className="p-2 text-slate-400 hover:text-white transition">
                    <Copy size={16}/>
                </button>
            </div>
        </div>
      )}
    </div>
  );
}