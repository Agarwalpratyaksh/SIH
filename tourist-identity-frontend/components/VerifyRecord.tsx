/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-empty-object-type */
// components/VerifyRecord.tsx
"use client";

import { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import CryptoJS from 'crypto-js';
import idl from '../idl/tourist_identity.json';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

const AES_SECRET_KEY = 'your-super-secret-key-for-encryption';
const PROGRAM_ID = new PublicKey("HMGBqpGvQyNicSDmHk8WCDQnm1LAXgFsLMEtEhxQAauU");
const PINATA_GATEWAY = "https://gateway.pinata.cloud";

type TouristDetails = { /* ... same as before ... */ };

export function VerifyRecord() {
  const [recordPubKey, setRecordPubKey] = useState('');
  const [status, setStatus] = useState({ message: '', type: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [decryptedDetails, setDecryptedDetails] = useState<TouristDetails | null>(null);

  const { connection } = useConnection();
  const wallet = useWallet();

  const getProvider = () => {
    if (!wallet || !wallet.publicKey) throw new Error("Wallet not connected");
    // @ts-ignore
    return new AnchorProvider(connection, wallet, AnchorProvider.defaultOptions());
  };

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!wallet.publicKey) {
      setStatus({ message: "Please connect your authority wallet.", type: 'error' });
      return;
    }
    setIsLoading(true);
    setStatus({ message: 'Verifying...', type: 'loading' });
    setDecryptedDetails(null);

    try {
      const provider = getProvider();
      const program = new Program(idl as any, provider);
      const recordAddress = new PublicKey(recordPubKey);

      setStatus({ message: 'Fetching record from Solana...', type: 'loading' });

      //@ts-ignore
      const record = await program.account.touristRecord.fetch(recordAddress);

      setStatus({ message: `Fetching data from IPFS (CID: ${record.ipfsCid.substring(0, 15)})...`, type: 'loading' });
      const ipfsUrl = `${PINATA_GATEWAY}/ipfs/${record.ipfsCid}`;
      const ipfsResponse = await fetch(ipfsUrl);
      if (!ipfsResponse.ok) throw new Error("Failed to fetch data from IPFS.");
      
      const ipfsJson = await ipfsResponse.json();
      const encryptedData = ipfsJson['encrypted_tourist_data'];
      if (!encryptedData) throw new Error("Could not find 'encrypted_tourist_data' in IPFS response.");

      setStatus({ message: 'Decrypting details...', type: 'loading' });
      const bytes = CryptoJS.AES.decrypt(encryptedData, AES_SECRET_KEY);
      const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
      if (!decryptedString) throw new Error("Decryption failed. Check secret key or data.");

      const details: TouristDetails = JSON.parse(decryptedString);
      setDecryptedDetails(details);
      setStatus({ message: 'Verification successful!', type: 'success' });

    } catch (error) {
      console.error(error);
      setStatus({ message: `Error: ${(error as Error).message}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = "w-full p-3 bg-slate-800 border border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none transition";

  return (
    <div className="flex flex-col gap-6 p-8 border border-slate-700 bg-slate-900/50 backdrop-blur-sm rounded-2xl max-w-2xl mx-auto shadow-2xl shadow-green-900/10">
      <h2 className="text-3xl font-bold text-center">Verify Tourist Record</h2>
      <form onSubmit={handleVerify} className="flex flex-col gap-4">
        <input
          className={inputClass}
          type="text"
          placeholder="Enter Tourist Record Public Key"
          value={recordPubKey}
          onChange={(e) => setRecordPubKey(e.target.value)}
          required
        />
        <motion.button 
            type="submit" 
            className="flex items-center justify-center gap-2 w-full bg-green-600 text-white p-3 font-bold rounded-lg hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-300"
            disabled={isLoading || !wallet.publicKey}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
        >
          {isLoading ? <><Loader2 className="animate-spin" /> Verifying...</> : 'Verify Record'}
        </motion.button>
      </form>

      {status.message && (
        <div className={`mt-2 text-center p-3 rounded-lg flex items-center justify-center gap-2
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

      {decryptedDetails && (
        <motion.div 
            className="mt-4 p-4 bg-slate-800/50 border border-slate-700 rounded-lg"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="font-bold text-lg text-green-300 mb-2">Decrypted Details:</h3>
          <pre className="whitespace-pre-wrap text-sm font-mono bg-slate-900 p-4 rounded-md text-slate-300 overflow-x-auto">
            {JSON.stringify(decryptedDetails, null, 2)}
          </pre>
        </motion.div>
      )}
    </div>
  );
}