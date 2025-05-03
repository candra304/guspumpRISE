const ethers = require("ethers");
const fs = require("fs");
const prompt = require("prompt-sync")();
const { HttpsProxyAgent } = require("https-proxy-agent");
const chalk = require("chalk");

function showBanner() {
  console.clear();
  console.log(chalk.magentaBright(`
█████╗ ██╗   ██╗████████╗ ██████╗
██╔══██╗██║   ██║╚══██╔══╝██╔═══██╗
███████║██║   ██║   ██║   ██║   ██║
██╔══██║██║   ██║   ██║   ██║   ██║
██║  ██║╚██████╔╝   ██║   ╚██████╔╝
╚═╝  ╚═╝ ╚═════╝    ╚═╝    ╚═════╝
SAT SET [by Chandra]
`));
}

const akunList = fs.readFileSync("akun.txt", "utf-8").trim().split("\n");
const proxyList = fs.readFileSync("proxy.txt", "utf-8").trim().split("\n");

const RPC = "https://testnet.riselabs.xyz/";
const WETH = "0x4200000000000000000000000000000000000006";
const USDC = "0x8A93d247134d91e0de6f96547cB0204e5BE8e5D8";
const DODO_ROUTER = "0x8c6DbF95448AcbcBb1c3D6E9b3b9ceF7E6fbAb00";

const GAS_OPTIONS = {
  gasPrice: ethers.utils.parseUnits("1", "gwei"),
  gasLimit: 300000
};

const WETH_ABI = [
  "function deposit() payable",
  "function withdraw(uint256 wad)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)"
];

const USDC_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)"
];

const DODO_ABI = [
  "function externalSwap(address fromToken, address toToken, uint256 fromTokenAmount, uint256 minReturnAmount, address midToken, address receiver, uint256 deadLine) returns (uint256)"
];

function getProviderWithProxy(proxyUrl) {
  const agent = new HttpsProxyAgent(proxyUrl);
  return new ethers.providers.JsonRpcProvider({ url: RPC, fetchOptions: { agent } });
}

function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}

async function wrapETH(wallet) {
  const weth = new ethers.Contract(WETH, WETH_ABI, wallet);
  const tx = await weth.deposit({ value: ethers.utils.parseEther("0.0001"), ...GAS_OPTIONS });
  await tx.wait();
  console.log("⚛️  Wrap 0.0001 ETH to WETH sukses");
}

async function unwarpWETH(wallet) {
  const weth = new ethers.Contract(WETH, WETH_ABI, wallet);
  const balance = await weth.balanceOf(wallet.address);
  if (balance.eq(0)) {
    console.log("❌  Tidak ada WETH untuk di-unwarp");
    return;
  }
  const tx = await weth.withdraw(balance, GAS_OPTIONS);
  await tx.wait();
  console.log("⚛️  Unwarp WETH ke ETH sukses");
}

async function swapWETHtoUSDC(wallet, amountOverride = null) {
  const weth = new ethers.Contract(WETH, WETH_ABI, wallet);
  const dodo = new ethers.Contract(DODO_ROUTER, DODO_ABI, wallet);

  const balance = await weth.balanceOf(wallet.address);
  const amountIn = amountOverride
    ? ethers.utils.parseEther(amountOverride)
    : balance.mul(30).div(100);

  if (amountIn.lt(ethers.utils.parseEther("0.00001"))) {
    return console.log("❌  Saldo WETH terlalu kecil untuk swap");
  }

  await weth.approve(DODO_ROUTER, amountIn, GAS_OPTIONS);

  const deadline = Math.floor(Date.now() / 1000) + 60;
  const tx = await dodo.externalSwap(
    WETH, USDC, amountIn, 0,
    ethers.constants.AddressZero, wallet.address, deadline,
    GAS_OPTIONS
  );

  console.log(tx.hash);

  const receipt = await tx.wait();
  console.log(receipt.status);

  console.log(`✅  Swap ${ethers.utils.formatEther(amountIn)} WETH to USDC sukses`);
}

async function swapUSDCtoWETH(wallet, amountOverride = null) {
  const usdc = new ethers.Contract(USDC, USDC_ABI, wallet);
  const dodo = new ethers.Contract(DODO_ROUTER, DODO_ABI, wallet);

  const balance = await usdc.balanceOf(wallet.address);
  const amountIn = amountOverride
    ? ethers.utils.parseUnits(amountOverride, 6)
    : balance.mul(30).div(100);

  console.log(`⚛️  Saldo USDC: ${ethers.utils.formatUnits(balance, 6)}`);
  console.log("⚙️   Menjalankan swap USDC ke WETH...");
  console.log("AmountIn:", ethers.utils.formatUnits(amountIn, 6));

  if (amountIn.lt(ethers.utils.parseUnits("0.5", 6))) {
    return console.log("❌  Saldo USDC terlalu kecil untuk swap");
  }

  const approveTx = await usdc.approve(DODO_ROUTER, amountIn, GAS_OPTIONS);
  await approveTx.wait();
  console.log("✅  Approve berhasil");

  const deadline = Math.floor(Date.now() / 1000) + 60;

  const tx = await dodo.externalSwap(
    USDC, WETH, amountIn, 0,
    ethers.constants.AddressZero, wallet.address, deadline,
    GAS_OPTIONS
  );

  console.log(tx.hash);

  const receipt = await tx.wait();
  console.log(receipt.status);

  console.log(`✅  Swap ${ethers.utils.formatUnits(amountIn, 6)} USDC ke WETH sukses`);
}

async function cekSaldo(wallet, index) {
  const ethBalance = await wallet.getBalance();
  const weth = new ethers.Contract(WETH, WETH_ABI, wallet);
  const wethBalance = await weth.balanceOf(wallet.address);
  console.log(`💳 Akun ${index + 1}: ETH: ${ethers.utils.formatEther(ethBalance)} | WETH: ${ethers.utils.formatUnits(wethBalance, 18)}`);
}

showBanner();
console.log("=== PILIH FITUR YANG INGIN DIJALANKAN ===");
console.log("1. Wrap ETH ke WETH");
console.log("2. Swap WETH ke USDC (input jumlah)");
console.log("3. Swap USDC ke WETH (input jumlah)");
console.log("4. Unwarp WETH ke ETH");
console.log("5. Cek saldo semua akun");
console.log("6. Jalankan semua fitur otomatis");
const pilihan = prompt("Masukkan pilihan (1-6): ");

let jumlahSwapWETH = null;
let jumlahSwapUSDC = null;

if (["2", "3", "6"].includes(pilihan)) {
  if (["2", "6"].includes(pilihan)) {
    jumlahSwapWETH = prompt("Masukkan jumlah WETH yang ingin di-swap ke USDC (dalam ETH, misal: 0.01): ");
  }
  if (["3", "6"].includes(pilihan)) {
    jumlahSwapUSDC = prompt("Masukkan jumlah USDC yang ingin di-swap ke WETH (dalam USDC, misal: 10): ");
  }
}

(async () => {
  for (let i = 0; i < akunList.length; i++) {
    const privateKey = akunList[i];
    const proxy = proxyList[i];
    const provider = getProviderWithProxy(proxy);
    const wallet = new ethers.Wallet(privateKey, provider);

    console.log(`\n💳 Akun ${i + 1} | Proxy: ${proxy}`);
    try {
      switch (pilihan) {
        case "1":
          await wrapETH(wallet);
          break;
        case "2":
          await swapWETHtoUSDC(wallet, jumlahSwapWETH);
          break;
        case "3":
          await swapUSDCtoWETH(wallet, jumlahSwapUSDC);
          break;
        case "4":
          await unwarpWETH(wallet);
          break;
        case "5":
          await cekSaldo(wallet, i);
          break;
        case "6":
          await swapUSDCtoWETH(wallet, jumlahSwapUSDC);
          await delay(2000 + Math.random() * 3000);
          await swapWETHtoUSDC(wallet, jumlahSwapWETH);
          await delay(2000 + Math.random() * 3000);
          await unwarpWETH(wallet);
          break;
        default:
          console.log("❌  Pilihan tidak valid.");
      }
      await delay(2000 + Math.random() * 3000);
    } catch (err) {
      console.log("❌  Error terjadi, silakan coba lagi.");
      console.log(`⏳   Kesalahan: ${err.message}`);
    }
  }
})();






