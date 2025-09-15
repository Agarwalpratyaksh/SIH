use anchor_lang::prelude::*;

declare_id!("HMGBqpGvQyNicSDmHk8WCDQnm1LAXgFsLMEtEhxQAauU");

#[program]
pub mod tourist_identity {
    use super::*;

    pub fn register_tourist(
        ctx: Context<Register>,
        data_hash: [u8; 32],
        ipfs_cid: String,
        issued_at: i64,
        validity: i64,
    ) -> Result<()> {
        
        let record = &mut ctx.accounts.tourist_record;
        record.authority = *ctx.accounts.authority.key;
        record.data_hash = data_hash;
        record.ipfs_cid = ipfs_cid;
        record.issued_at = issued_at;
        record.validity = validity;

        let record = &ctx.accounts.tourist_record;

        msg!("Tourist Record:");
        msg!("  Authority: {}", record.authority);
        msg!("  Data Hash: {:?}", record.data_hash);
        msg!("  IPFS CID: {}", record.ipfs_cid);
        msg!("  Issued At: {}", record.issued_at);
        msg!("  Validity: {}", record.validity);
        // duration


        Ok(())
    }
}

#[derive(Accounts)]
pub struct Register<'info> {
    #[account(init, payer = authority, space = 8 + 32 + 64 + 8 + 8 + 32)]
    pub tourist_record: Account<'info, TouristRecord>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct TouristRecord {
    pub authority: Pubkey,
    pub data_hash: [u8; 32], // SHA-256 hash
    pub ipfs_cid: String,    // IPFS CID
    pub issued_at: i64,      // timestamp (Unix)
    pub validity: i64,       // validity in seconds or days
}
