// app/api/uploadToPinata/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { encryptedData } = await request.json();

    if (!encryptedData) {
      return NextResponse.json({ error: 'No encryptedData provided' }, { status: 400 });
    }

    const pinataBody = {
      pinataContent: {
        encrypted_tourist_data: encryptedData,
      },
      pinataMetadata: {
        name: 'Tourist Identity Record',
      },
    };

    const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PINATA_JWT}`, // Use the modern JWT
      },
      body: JSON.stringify(pinataBody),
    });

    if (!res.ok) {
      const errorData = await res.text();
      throw new Error(`Pinata API error: ${errorData}`);
    }

    const data = await res.json();

    // The CID is returned in the IpfsHash property
    return NextResponse.json({ ipfsCid: data.IpfsHash }, { status: 200 });

  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}