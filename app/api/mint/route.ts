import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

export async function POST(req: Request) {
  try {
    const { playerAddress, degenScore, classification } = await req.json();

    if (!playerAddress || !playerAddress.startsWith('0x')) {
      return NextResponse.json({ error: 'Invalid player address' }, { status: 400 });
    }

    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      return NextResponse.json({ 
        error: 'PRIVATE_KEY not configured in .env.local on the server.' 
      }, { status: 500 });
    }

    // Initialize signing wallet (this will be the authorizedSigner on the contract)
    const wallet = new ethers.Wallet(privateKey);

    // Dynamic metadata URI
    const tokenURI = `https://roastmywallet.lol/api/metadata/${playerAddress}`;

    // Cryptographic hash of the mint parameters (abi.encodePacked format)
    const messageHash = ethers.solidityPackedKeccak256(
      ['address', 'uint256', 'string', 'string'],
      [playerAddress, degenScore, classification, tokenURI]
    );

    // Sign the 32-byte hash message
    const signature = await wallet.signMessage(ethers.getBytes(messageHash));

    return NextResponse.json({
      success: true,
      degenScore,
      classification,
      tokenURI,
      signature
    });

  } catch (error: any) {
    console.error('Error signing badge:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to sign mint details' 
    }, { status: 500 });
  }
}
