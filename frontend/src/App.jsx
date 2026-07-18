import { useState, useEffect } from 'react';
import { BrowserProvider, JsonRpcProvider, Contract, formatUnits, parseUnits } from 'ethers';
import { REGISTRY_ADDRESS, TOKEN_ADDRESS, REGISTRY_ABI, TOKEN_ABI } from './config';

function App() {
  // --- PART A States ---
  const [walletAddress, setWalletAddress] = useState("");
  const [alutBalance, setAlutBalance] = useState("0");
  const [error, setError] = useState("");
  const [registryContract, setRegistryContract] = useState(null);
  const [tokenContract, setTokenContract] = useState(null);

  // --- PART B States ---
  const [imagePreview, setImagePreview] = useState(null);
  const [fileHash, setFileHash] = useState("");
  const [assetName, setAssetName] = useState("");
  const [fileType, setFileType] = useState("");
  const [txLoading, setTxLoading] = useState(false);
  const [txSuccess, setTxSuccess] = useState("");
  const [txError, setTxError] = useState("");

  // --- PART C States ---
  const [verifyMethod, setVerifyMethod] = useState("file");
  const [verifyInputHash, setVerifyInputHash] = useState("");
  const [verifyStatus, setVerifyStatus] = useState(null);
  const [verifyMetadata, setVerifyMetadata] = useState(null);

  // --- PART D States (Token Distribution) ---
  const [isOwner, setIsOwner] = useState(false);
  const [myPercentage, setMyPercentage] = useState("0");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [distributeAmount, setDistributeAmount] = useState("");
  const [distTxLoading, setDistTxLoading] = useState(false);
  const [distTxMessage, setDistTxMessage] = useState("");

  // ==========================================
  // WALLET & CONTRACT INIT
  // ==========================================
  // Connect MetaMask and load the signer-backed contracts.
  const connectWallet = async () => {
    if (!window.ethereum) {
      setError("MetaMask is not installed.");
      return;
    }
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      setWalletAddress(address);
      setError("");

      const registry = new Contract(REGISTRY_ADDRESS, REGISTRY_ABI, signer);
      const token = new Contract(TOKEN_ADDRESS, TOKEN_ABI, signer);

      setRegistryContract(registry);
      setTokenContract(token);

      // Fetch Balance
      const balance = await token.balanceOf(address);
      setAlutBalance(formatUnits(balance, 18));

      // PART D: Fetch Ownership Data
      const contractOwner = await token.owner();
      setIsOwner(address.toLowerCase() === contractOwner.toLowerCase());

      const pct = await token.ownershipPercentage(address);
      setMyPercentage(pct.toString());

    } catch (err) {
      console.error(err);
      setError(err.reason || err.message || "Failed to connect wallet.");
    }
  };

  // ==========================================
  // REGISTRATION & VERIFICATION LOGIC (Parts B & C)
  // ==========================================
  // Hash the uploaded file before registering it.
  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setTxSuccess(""); setTxError("");
    setImagePreview(URL.createObjectURL(selectedFile));
    const derivedType = selectedFile.type ? selectedFile.type.split('/')[1].toUpperCase() : "PNG";
    setFileType(derivedType);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const hashBuffer = await crypto.subtle.digest('SHA-256', event.target.result);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      setFileHash('0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join(''));
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  // Register a new asset with the given details.
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!registryContract) return;
    setTxLoading(true); setTxError(""); setTxSuccess("");
    try {
      const tx = await registryContract.registerAsset(assetName, fileType, fileHash);
      await tx.wait();
      setTxSuccess(`Success! Asset immutably registered.`);
    } catch (err) {
      setTxError(err.reason || "Transaction failed.");
    } finally {
      setTxLoading(false);
    }
  };

  // Prepare the hash from an uploaded file for verification.
  const handleVerifyFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setVerifyStatus(null); setVerifyMetadata(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const hashBuffer = await crypto.subtle.digest('SHA-256', event.target.result);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      setVerifyInputHash('0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join(''));
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  // Verify the computed hash against the official registry record.
  const handleVerify = async () => {
    if (!verifyInputHash) return;
    setVerifyStatus("loading"); setVerifyMetadata(null);
    try {
      const readOnlyProvider = new JsonRpcProvider("http://127.0.0.1:8545");
      const readOnlyRegistry = new Contract(REGISTRY_ADDRESS, REGISTRY_ABI, readOnlyProvider);
      const OFFICIAL_LOGO_ID = 1;

      const [isAuthentic, ] = await readOnlyRegistry.verifyLogoIntegrity(OFFICIAL_LOGO_ID, verifyInputHash);

      if (isAuthentic === true) {
        setVerifyStatus("success");
        const asset = await readOnlyRegistry.getAsset(OFFICIAL_LOGO_ID);
        setVerifyMetadata({
          name: asset.name, type: asset.fileType,
          date: new Date(Number(asset.registeredAt) * 1000).toLocaleString()
        });
      } else {
        setVerifyStatus("fail");
      }
    } catch (err) {
      setVerifyStatus("fail");
    }
  };

  // ==========================================
  // PART D: DISTRIBUTION LOGIC
  // ==========================================
  // Send ALUT shares to a recipient when the owner submits the form.
  const handleDistribute = async (e) => {
    e.preventDefault();
    if (!tokenContract) return;
    if (Number(distributeAmount) <= 0) {
      setDistTxMessage("Amount must be greater than 0.");
      return;
    }

    setDistTxLoading(true);
    setDistTxMessage("");

    try {
      // Parse the standard number into BigInt with 18 decimals for the ERC20 contract
      const amountParsed = parseUnits(distributeAmount.toString(), 18);
      const tx = await tokenContract.distributeShares(recipientAddress, amountParsed);
      await tx.wait();

      setDistTxMessage(`Successfully sent ${distributeAmount} ALUT to ${formatAddress(recipientAddress)}`);

      // Refresh balances
      const balance = await tokenContract.balanceOf(walletAddress);
      setAlutBalance(formatUnits(balance, 18));
      const pct = await tokenContract.ownershipPercentage(walletAddress);
      setMyPercentage(pct.toString());

      setRecipientAddress("");
      setDistributeAmount("");
    } catch (err) {
      console.error(err);
      setDistTxMessage(err.reason || "Distribution failed. Ensure you have enough balance.");
    } finally {
      setDistTxLoading(false);
    }
  };

  const formatAddress = (address) => `${address.slice(0, 6)}...${address.slice(-4)}`;

  // Keep the UI in sync when the connected account changes.
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length > 0) connectWallet();
        else { setWalletAddress(""); setAlutBalance("0"); setIsOwner(false); }
      });
    }
  }, []);

  return (
    // Main UI sections: verification, wallet, distribution, and registration.
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '2rem', maxWidth: '800px', margin: '0 auto', color: '#fff', backgroundColor: '#121214', minHeight: '100vh' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>ALU Brand Protection dApp</h1>

      {/* PART C: Public Verification */}
      <div style={{ padding: '1.5rem', border: '2px solid #00b37e', borderRadius: '8px', backgroundColor: '#1a1a1e', marginBottom: '2rem' }}>
        <h2 style={{ marginTop: 0, color: '#00b37e' }}>Public Logo Verification</h2>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <button onClick={() => {setVerifyMethod('file'); setVerifyStatus(null); setVerifyInputHash("");}} style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: verifyMethod === 'file' ? '#333' : 'transparent', color: 'white', border: '1px solid #333', borderRadius: '4px' }}>Verify by File</button>
          <button onClick={() => {setVerifyMethod('hash'); setVerifyStatus(null); setVerifyInputHash("");}} style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: verifyMethod === 'hash' ? '#333' : 'transparent', color: 'white', border: '1px solid #333', borderRadius: '4px' }}>Verify by Hash</button>
        </div>
        {verifyMethod === 'file' ? (
          <input type="file" accept="image/*" onChange={handleVerifyFileChange} style={{ display: 'block', width: '100%', marginBottom: '1rem' }} />
        ) : (
          <input type="text" placeholder="Paste SHA-256 Hash (0x...)" value={verifyInputHash} onChange={(e) => setVerifyInputHash(e.target.value)} style={{ width: '96%', padding: '10px', borderRadius: '4px', border: '1px solid #29292e', backgroundColor: '#121214', color: '#fff', marginBottom: '1rem' }} />
        )}
        <button onClick={handleVerify} disabled={!verifyInputHash || verifyStatus === 'loading'} style={{ width: '100%', padding: '12px', fontSize: '16px', fontWeight: 'bold', cursor: verifyInputHash ? 'pointer' : 'not-allowed', backgroundColor: '#00b37e', color: 'white', border: 'none', borderRadius: '6px' }}>
          {verifyStatus === 'loading' ? "Checking..." : "Verify Authenticity"}
        </button>

        {verifyStatus === 'success' && (
          <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#00291d', border: '1px solid #00b37e', borderRadius: '6px' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#00b37e' }}>✅ Logo Verified: Authentic</h3>
            {verifyMetadata && (
              <ul style={{ marginTop: '10px', fontSize: '14px', color: '#fff', paddingLeft: '20px' }}>
                <li><strong>Asset Name:</strong> {verifyMetadata.name}</li>
                <li><strong>Registered On:</strong> {verifyMetadata.date}</li>
              </ul>
            )}
          </div>
        )}
        {verifyStatus === 'fail' && (
          <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#3e1619', border: '1px solid #f75a68', borderRadius: '6px' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#f75a68' }}>⚠️ Warning: Invalid Logo</h3>
          </div>
        )}
      </div>

      <hr style={{ borderColor: '#29292e', margin: '3rem 0' }} />

      <h2 style={{ textAlign: 'center', color: '#666', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '2px' }}>Admin & Staff Portal</h2>

      {/* PART A: Wallet UI */}
      <div style={{ padding: '1.5rem', border: '1px solid #29292e', borderRadius: '8px', backgroundColor: '#202024', marginBottom: '2rem' }}>
        <h2 style={{ marginTop: 0 }}>Wallet Profile</h2>
        {error && <p style={{ color: '#f75a68' }}>{error}</p>}
        {walletAddress ? (
          <div>
            <p><strong>Connected Account:</strong> {formatAddress(walletAddress)} {isOwner && <span style={{backgroundColor: '#00b37e', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', marginLeft: '8px'}}>Contract Owner</span>}</p>
            <p><strong>My Share Balance:</strong> {alutBalance} ALUT</p>
            <p><strong>My Ownership Stake:</strong> {myPercentage}%</p>
          </div>
        ) : (
          <button onClick={connectWallet} style={{ padding: '12px 24px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: '#00875f', color: 'white', border: 'none', borderRadius: '6px' }}>
            Connect Web3 Wallet
          </button>
        )}
      </div>

      {walletAddress && (
        <>
          {/* PART D: Distribution Dashboard */}
          <div style={{ padding: '1.5rem', border: '1px solid #29292e', borderRadius: '8px', backgroundColor: '#202024', marginBottom: '2rem' }}>
            <h2 style={{ marginTop: 0 }}>ALUT Token Distribution</h2>
            <p style={{ color: '#ccc', marginBottom: '1.5rem' }}>Total Supply: 1,000,000 ALUT</p>

            <h3 style={{ fontSize: '16px', color: '#aaa', borderBottom: '1px solid #333', paddingBottom: '8px' }}>Stakeholder Examples</h3>
            <table style={{ width: '100%', textAlign: 'left', marginBottom: '2rem', fontSize: '14px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ color: '#888' }}>
                  <th style={{ paddingBottom: '8px' }}>Stakeholder</th>
                  <th style={{ paddingBottom: '8px' }}>Wallet Address</th>
                  <th style={{ paddingBottom: '8px' }}>Target Ownership</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '8px 0', borderBottom: '1px solid #333' }}>ALU Administration</td>
                  <td style={{ padding: '8px 0', borderBottom: '1px solid #333' }}>0x71C...976F</td>
                  <td style={{ padding: '8px 0', borderBottom: '1px solid #333' }}>50%</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0', borderBottom: '1px solid #333' }}>Student Council</td>
                  <td style={{ padding: '8px 0', borderBottom: '1px solid #333' }}>0x23B...142A</td>
                  <td style={{ padding: '8px 0', borderBottom: '1px solid #333' }}>25%</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0', borderBottom: '1px solid #333' }}>Faculty Board</td>
                  <td style={{ padding: '8px 0', borderBottom: '1px solid #333' }}>0x89D...551C</td>
                  <td style={{ padding: '8px 0', borderBottom: '1px solid #333' }}>25%</td>
                </tr>
              </tbody>
            </table>

            {/* Owner Only Transfer Form */}
            {isOwner ? (
              <div style={{ padding: '1rem', backgroundColor: '#121214', borderRadius: '6px', border: '1px solid #333' }}>
                <h3 style={{ marginTop: 0, color: '#00b37e', fontSize: '16px' }}>Distribute Shares (Owner Only)</h3>
                <form onSubmit={handleDistribute}>
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                    <input type="text" placeholder="Recipient Address (0x...)" value={recipientAddress} onChange={(e) => setRecipientAddress(e.target.value)} required style={{ flex: 2, padding: '10px', borderRadius: '4px', border: '1px solid #29292e', backgroundColor: '#1a1a1e', color: '#fff' }} />
                    <input type="number" placeholder="Amount" value={distributeAmount} onChange={(e) => setDistributeAmount(e.target.value)} required style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #29292e', backgroundColor: '#1a1a1e', color: '#fff' }} />
                  </div>
                  <button type="submit" disabled={distTxLoading} style={{ width: '100%', padding: '10px', fontWeight: 'bold', cursor: distTxLoading ? 'not-allowed' : 'pointer', backgroundColor: '#00875f', color: 'white', border: 'none', borderRadius: '4px' }}>
                    {distTxLoading ? "Processing Transfer..." : "Send ALUT Tokens"}
                  </button>
                </form>
                {distTxMessage && <p style={{ marginTop: '1rem', fontSize: '14px', color: distTxMessage.includes('failed') ? '#f75a68' : '#00b37e' }}>{distTxMessage}</p>}
              </div>
            ) : (
              <div style={{ padding: '1rem', backgroundColor: '#3e1619', borderRadius: '6px', border: '1px solid #f75a68', textAlign: 'center' }}>
                <p style={{ margin: 0, color: '#f75a68', fontSize: '14px' }}>🔒 You are not the contract owner. Distribution controls are disabled.</p>
              </div>
            )}
          </div>

          {/* PART B: Asset Registration */}
          <div style={{ padding: '1.5rem', border: '1px solid #29292e', borderRadius: '8px', backgroundColor: '#202024' }}>
            <h2 style={{ marginTop: 0 }}>Register New Brand Asset</h2>
            <div style={{ marginBottom: '1.5rem' }}>
              <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'block', width: '100%' }} />
            </div>
            {imagePreview && (
              <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', alignItems: 'center', padding: '1rem', backgroundColor: '#121214', borderRadius: '6px' }}>
                <img src={imagePreview} alt="Preview" style={{ maxWidth: '120px', maxHeight: '120px', borderRadius: '4px', objectFit: 'contain' }} />
                <div style={{ wordBreak: 'break-all', fontSize: '14px' }}>
                  <p style={{ margin: '0 0 0.5rem 0' }}><strong style={{ color: '#00b37e' }}>Computed SHA-256 Hash:</strong></p>
                  <code>{fileHash}</code>
                </div>
              </div>
            )}
            {fileHash && (
              <form onSubmit={handleRegister}>
                <div style={{ marginBottom: '1rem' }}><input type="text" placeholder="Asset Name" value={assetName} onChange={(e) => setAssetName(e.target.value)} required style={{ width: '96%', padding: '10px', borderRadius: '4px', border: '1px solid #29292e', backgroundColor: '#121214', color: '#fff' }} /></div>
                <div style={{ marginBottom: '1.5rem' }}><input type="text" placeholder="File Type" value={fileType} onChange={(e) => setFileType(e.target.value)} required style={{ width: '96%', padding: '10px', borderRadius: '4px', border: '1px solid #29292e', backgroundColor: '#121214', color: '#fff' }} /></div>
                <button type="submit" disabled={txLoading} style={{ width: '100%', padding: '12px', fontSize: '16px', fontWeight: 'bold', cursor: txLoading ? 'not-allowed' : 'pointer', backgroundColor: '#00b37e', color: 'white', border: 'none', borderRadius: '6px' }}>
                  {txLoading ? "Processing Transaction..." : "Register Asset"}
                </button>
              </form>
            )}
            {txSuccess && <p style={{ color: '#00b37e', marginTop: '1rem', fontWeight: 'bold' }}>{txSuccess}</p>}
            {txError && <p style={{ color: '#f75a68', marginTop: '1rem', fontWeight: 'bold' }}>{txError}</p>}
          </div>
        </>
      )}
    </div>
  );
}

export default App;