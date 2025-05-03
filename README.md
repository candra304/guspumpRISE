# Gas Pump CLI - Rise Testnet

Script untuk automasi wrap, swap, dan unwarp token di Rise Testnet menggunakan proxy & multi-akun.
pastikan wrap terlebih dahulu, agar tidak kekurangan amount untuk swap

========================================
  █████╗ ██╗   ██╗████████╗ ██████╗
 ██╔══██╗██║   ██║╚══██╔══╝██╔═══██╗
 ███████║██║   ██║   ██║   ██║   ██║
 ██╔══██║██║   ██║   ██║   ██║   ██║
 ██║  ██║╚██████╔╝   ██║   ╚██████╔╝
 ╚═╝  ╚═╝ ╚═════╝    ╚═╝    ╚═════╝
SAT SET
                           [by Chandra]
========================================
=== PILIH FITUR YANG INGIN DIJALANKAN ===
1. Wrap ETH ke WETH
2. Swap WETH ke USDC 
3. Swap USDC ke WETH 
4. Unwarp WETH ke ETH
5. Cek saldo semua akun
6. Jalankan semua fitur otomatis
Masukkan pilihan (1-6):



## Cara Pakai (Linux)

### 1. Clone repo
```bash
git clone https://github.com/candra304/guspumpRISE.git
cd guspumpRISE


```
# install dependency
npm install ethers prompt-sync https-proxy-agent chalk
```
npm install
```
# siap kan file 
1. ```
   nano akun.txt
2. ```
   nano proxy.txt

   ```
# jalan kan 
```
node index.js

```
## catatan 
kalo mau ubah amount eth yg di wrap, ubh aja nominal nya di sini 


async function wrapETH(wallet) {
  const weth = new ethers.Contract(WETH, WETH_ABI, wallet);
  const tx = await weth.deposit({ value: ethers.utils.parseEther("0.0001"), ...GAS_OPTIONS });
  await tx.wait();
  

( bagian 0.0001 ke jumlah yg di inginkan)
