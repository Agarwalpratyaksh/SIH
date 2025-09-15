import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { BN } from "bn.js";
import { expect } from "chai";

describe("tourist_identity", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.TouristIdentity as Program;

  it("Registers a tourist", async () => {
    // Generate new Keypair for the tourist record
    const touristRecord = Keypair.generate();
    // Simulate some data
    const dataHash = new Uint8Array(32); // 32-byte zero array
    dataHash[0] = 123; // Set a value for testing
    const ipfsCid = "QmSomeFakeCID1234567890";
    const issuedAt = Math.floor(Date.now() / 1000); // current Unix time
    const validity = 60 * 60 * 24 * 30; // 30 days in seconds

    // Call the register_tourist instruction
    await program.methods
      .registerTourist(
        [...dataHash],
        ipfsCid,
        new BN(issuedAt),
        new BN(validity)
      )
      .accounts({
        touristRecord: touristRecord.publicKey,
        authority: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([touristRecord])
      .rpc();

    // Fetch the account
    const record = await program.account.touristRecord.fetch(touristRecord.publicKey);

    // Assertions
    expect(record.authority.toBase58()).to.equal(provider.wallet.publicKey.toBase58());
    expect(record.dataHash[0]).to.equal(123);
    expect(record.ipfsCid).to.equal(ipfsCid);
    expect(record.issuedAt.toNumber()).to.equal(issuedAt);
    expect(record.validity.toNumber()).to.equal(validity);
  });
});
