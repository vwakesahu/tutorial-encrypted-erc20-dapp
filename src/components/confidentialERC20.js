import { useEffect, useState } from "react";
import {
  Wallet,
  Lock,
  RefreshCw,
  HelpCircle,
  Key,
  DollarSign,
  ArrowUpIcon,
  LogOut,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { CodeSnippets } from "./code-snippets";
import { Contract, ethers } from "ethers";
import { toHexString } from "@/utils/utils";
import erc20ABI from "@/abi/erc20ABI.json";
import Link from "next/link";
import { getFhevmInstance } from "@/utils/fhevm";
import { usePrivy } from "@privy-io/react-auth";
import { useWalletContext } from "@/privy/walletContext";

const CONTRACT_ADDRESS = "0x7b8841f22de98900ae19235B7602ACD4bd3bEc29";
const mintABI = [
  {
    inputs: [
      {
        internalType: "einput",
        name: "encryptedAmount",
        type: "bytes32",
      },
      {
        internalType: "bytes",
        name: "inputProof",
        type: "bytes",
      },
    ],
    name: "_mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const ConfidentialERC20 = () => {
  const { signer } = useWalletContext();
  const [amountMint, setAmountMint] = useState("");
  const [isMinting, setIsMinting] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [userBalance, setUserBalance] = useState("Hidden");
  const [instance, setInstance] = useState(null);
  const { logout: disconnect } = usePrivy();

  useEffect(() => {
    const getInstance = async () => {
      const instance = await getFhevmInstance();
      setInstance(instance);
    };

    getInstance();
  }, []);

  if (!instance) return null;

  const mint = async (event) => {
    event.preventDefault();
    setIsMinting(true);
    try {
      const contract = new Contract(CONTRACT_ADDRESS, mintABI, signer);
      const input = await instance.createEncryptedInput(
        CONTRACT_ADDRESS,
        await signer.getAddress()
      );
      input.add64(ethers.parseUnits(amountMint.toString(), 6));
      const encryptedInput = input.encrypt();

      const response = await contract._mint(
        encryptedInput.handles[0],
        "0x" + toHexString(encryptedInput.inputProof),
        {
          gasLimit: 1000000
        }
      );
      const tx = await response.getTransaction();
      await tx.wait();
      setAmountMint("");
    } catch (e) {
      console.log(e);
    } finally {
      setIsMinting(false);
    }
  };

  const reencrypt = async () => {
    setIsDecrypting(true);
    try {
      // Step 1: Check local storage for existing keys and EIP-712 signature for this contract
      const contractKey = `reencrypt_${CONTRACT_ADDRESS}`;
      const storedData = JSON.parse(localStorage.getItem(contractKey));

      let publicKey, privateKey, signature;

      if (storedData) {
        // Use existing keys and signature if found
        ({ publicKey, privateKey, signature } = storedData);
      } else {
        // Step 2: Generate keys and request EIP-712 signature if no data in local storage
        const { publicKey: genPublicKey, privateKey: genPrivateKey } =
          instance.generateKeypair();
        const eip712 = instance.createEIP712(genPublicKey, CONTRACT_ADDRESS);

        // Prompt user to sign the EIP-712 message
        signature = await signer._signTypedData(
          eip712.domain,
          { Reencrypt: eip712.types.Reencrypt },
          eip712.message
        );

        // Store generated data in local storage
        publicKey = genPublicKey;
        privateKey = genPrivateKey;
        localStorage.setItem(
          contractKey,
          JSON.stringify({ publicKey, privateKey, signature })
        );
      }

      // Step 3: Use the public key, private key, and signature in the reencrypt function
      const contract = new Contract(CONTRACT_ADDRESS, erc20ABI, signer);
      const balanceHandle = await contract.balanceOf(await signer.getAddress());

      if (balanceHandle.toString() === "0") {
        setUserBalance("0");
      } else {
        const balanceResult = await instance.reencrypt(
          balanceHandle,
          privateKey,
          publicKey,
          signature.replace("0x", ""),
          CONTRACT_ADDRESS,
          await signer.getAddress()
        );
        setUserBalance(balanceResult.toString());
      }
    } catch (e) {
      console.log(e);
    } finally {
      setIsDecrypting(false);
    }
  };

  const formatBalance = (balance) => {
    if (balance === "Hidden") return balance;
    const amount = balance?.slice(0, -6) || "0";
    return `${Number(amount).toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-mono">
      <div className="border-b border-slate-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img src="/inco-logo.svg" alt="Inco Logo" className="w-24" />
              <h1 className="text-xl font-bold text-[#BCD0FC] hidden md:flex">
                Confidential ERC20
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              {" "}
              <Button
                variant="outline"
                size="sm"
                className="bg-red-500/10 border-red-500/20 hover:bg-red-500/20 text-red-400 hover:text-white"
                onClick={disconnect}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Disconnect
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-8 h-full grid place-items-center w-full md:mt-12 mt-4">
        <div className="grid gap-6 md:grid-cols-1 md:max-w-xl w-full">
          <div className="flex justify-end gap-3">
            <Link href="https://faucet.rivest.inco.org" target="_blank">
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-transparent hover:text-white/80"
              >
                <ArrowUpIcon className="w-4 h-4 mr-2 rotate-45" />
                Get Inco Tokens
              </Button>
            </Link>
            <div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-green-500/10 border-green-500/20 hover:bg-green-500/20 text-green-400 hover:text-white"
                  >
                    <HelpCircle className="w-4 h-4 mr-2" />
                    How it works?
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl bg-slate-900 border-slate-800 font-mono">
                  <DialogHeader>
                    <DialogTitle className="flex items-center space-x-2 text-fuchsia-50 font-mono">
                      <Key className="w-5 h-5" />
                      <span>Smart Contract Implementation</span>
                    </DialogTitle>
                  </DialogHeader>
                  <CodeSnippets />
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-slate-200">
                  Token Info
                </h2>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Name:</span>
                    <span className="text-green-400">Confidential ERC-20</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Symbol:</span>
                    <span className="text-green-400">CUSD</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Balance:</span>
                    <div className="flex items-center space-x-2">
                      {userBalance === "Hidden" ? (
                        <Lock size={16} className="text-slate-500" />
                      ) : (
                        <DollarSign size={16} className="text-green-400" />
                      )}
                      <span
                        className={`${
                          userBalance === "Hidden"
                            ? "text-white/80"
                            : "text-green-400"
                        }`}
                      >
                        {formatBalance(userBalance)}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  className="w-full bg-green-500/10 border-green-500/20 hover:bg-green-500/20 text-green-400 hover:text-white"
                  variant="outline"
                  onClick={reencrypt}
                  disabled={isDecrypting}
                >
                  {isDecrypting ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Decrypting...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Decrypt Balance
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <form onSubmit={mint} className="space-y-4">
                <h2 className="text-lg font-semibold text-slate-200">
                  Mint Tokens
                </h2>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <input
                    type="text"
                    className="w-full bg-slate-900 border border-slate-700 rounded-md pl-10 pr-4 py-2 text-slate-300 placeholder-slate-500"
                    placeholder="Enter amount"
                    value={amountMint}
                    onChange={(e) => setAmountMint(e.target.value)}
                    disabled={isMinting}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                  disabled={isMinting || !amountMint}
                >
                  {isMinting ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Minting...
                    </>
                  ) : (
                    <>
                      <Wallet className="w-4 h-4 mr-2" />
                      Mint
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ConfidentialERC20;
