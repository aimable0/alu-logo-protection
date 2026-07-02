import { createHash } from 'crypto';
import { readFileSync } from 'fs';

// Read the image file as a buffer
const fileBuffer = readFileSync('alu-logo.png');

// Generate the SHA-256 hash
const hashSum = createHash('sha256');
hashSum.update(fileBuffer);

const hexHash = hashSum.digest('hex');

// Prepend '0x' because Solidity expects bytes32 to be formatted as a hex string
console.log(`Your SHA-256 Hash is: 0x${hexHash}`);
