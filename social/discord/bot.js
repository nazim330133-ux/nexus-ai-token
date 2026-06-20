const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes, EmbedBuilder } = require("discord.js");
const { ethers } = require("ethers");

// === KONFIGURASYON ===
// 1. https://discord.com/developers/applications adresinden uygulama olustur
// 2. Bot > Token al, buraya yapistir
// 3. OAuth2 > URL Generator > bot + Send Messages > URL ile sunucuna davet et
const BOT_TOKEN = "YOUR_DISCORD_BOT_TOKEN_HERE";
const CLIENT_ID = "YOUR_DISCORD_CLIENT_ID_HERE";

const TOKEN_ADDR = "0x3371f6F00B3ee5Cc6D7E5d8BbEc27961B772001E";
const STAKING_ADDR = "0x6409896461688E0a25cF8Ee5DD3f3CC0a9ba0c3c";
const POOL_ADDR = "0xBcFe9a8498c4b702c739BE67012D18c48d220F28";
const RPC = "https://data-seed-prebsc-1-s1.binance.org:8545/";
const EXPLORER = "https://testnet.bscscan.com";

const provider = new ethers.JsonRpcProvider(RPC);
const tokenABI = ["function name() view returns (string)", "function symbol() view returns (string)", "function totalSupply() view returns (uint256)"];
const token = new ethers.Contract(TOKEN_ADDR, tokenABI, provider);
const poolABI = ["function totalStaked() view returns (uint256)"];
const pool = new ethers.Contract(STAKING_ADDR, poolABI, provider);

const commands = [
  new SlashCommandBuilder().setName("info").setDescription("Token bilgilerini goster"),
  new SlashCommandBuilder().setName("supply").setDescription("Toplam arzi goster"),
  new SlashCommandBuilder().setName("staking").setDescription("Staking Pool durumu"),
  new SlashCommandBuilder().setName("price").setDescription("Guncel NXI fiyati"),
  new SlashCommandBuilder().setName("contract").setDescription("Kontrat adresleri"),
  new SlashCommandBuilder().setName("help").setDescription("Komut listesi"),
].map(c => c.toJSON());

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("ready", async () => {
  console.log(`✅ Discord bot aktif: ${client.user.tag}`);

  const rest = new REST({ version: "10" }).setToken(BOT_TOKEN);
  try {
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log("✅ Slash komutlar kaydedildi");
  } catch (e) {
    console.error("Komut kaydi hatasi:", e);
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  await interaction.deferReply();

  try {
    switch (interaction.commandName) {
      case "info": {
        const [name, symbol, supply] = await Promise.all([token.name(), token.symbol(), token.totalSupply()]);
        const embed = new EmbedBuilder()
          .setColor(0x3B82F6)
          .setTitle(`${name} (${symbol})`)
          .addFields(
            { name: "İsim", value: name, inline: true },
            { name: "Sembol", value: `$${symbol}`, inline: true },
            { name: "Toplam Arz", value: `${Number(ethers.formatEther(supply)).toLocaleString()} ${symbol}`, inline: true },
            { name: "Standart", value: "BEP-20", inline: true },
            { name: "Ag", value: "BSC Testnet", inline: true },
            { name: "Kontrat", value: `\`${TOKEN_ADDR}\``, inline: false },
          )
          .setURL(`${EXPLORER}/address/${TOKEN_ADDR}`);
        await interaction.editReply({ embeds: [embed] });
        break;
      }

      case "supply": {
        const supply = await token.totalSupply();
        await interaction.editReply(`💰 **Toplam Arz:** ${Number(ethers.formatEther(supply)).toLocaleString()} NXI`);
        break;
      }

      case "staking": {
        const totalStaked = await pool.totalStaked();
        const embed = new EmbedBuilder()
          .setColor(0x10B981)
          .setTitle("🏦 Staking Pool")
          .addFields(
            { name: "Toplam Stake", value: `${Number(ethers.formatEther(totalStaked)).toLocaleString()} NXI`, inline: true },
            { name: "APY", value: "%50", inline: true },
            { name: "Kontrat", value: `\`${STAKING_ADDR}\``, inline: false },
          )
          .setURL(`${EXPLORER}/address/${STAKING_ADDR}`);
        await interaction.editReply({ embeds: [embed] });
        break;
      }

      case "price": {
        const pairABI = ["function getReserves() view returns (uint112,uint112,uint32)", "function token0() view returns (address)"];
        const pair = new ethers.Contract(POOL_ADDR, pairABI, provider);
        const [reserves, token0] = await Promise.all([pair.getReserves(), pair.token0()]);
        const isNXI0 = token0.toLowerCase() === TOKEN_ADDR.toLowerCase();
        const reserveNXI = ethers.formatEther(isNXI0 ? reserves[0] : reserves[1]);
        const reserveBNB = ethers.formatEther(isNXI0 ? reserves[1] : reserves[0]);
        const price = Number(reserveBNB) / Number(reserveNXI);
        await interaction.editReply(
          `💹 **Fiyat:** 1 NXI = ${price.toFixed(12)} BNB\n` +
          `📊 Havuz: ${Number(reserveNXI).toLocaleString()} NXI / ${Number(reserveBNB).toFixed(6)} BNB`
        );
        break;
      }

      case "contract": {
        const embed = new EmbedBuilder()
          .setColor(0x8B5CF6)
          .setTitle("📜 Kontrat Adresleri")
          .addFields(
            { name: "Token", value: `\`${TOKEN_ADDR}\`\n[Explorer](${EXPLORER}/address/${TOKEN_ADDR})`, inline: false },
            { name: "StakingPool", value: `\`${STAKING_ADDR}\`\n[Explorer](${EXPLORER}/address/${STAKING_ADDR})`, inline: false },
            { name: "LP Pool", value: `\`${POOL_ADDR}\`\n[Explorer](${EXPLORER}/address/${POOL_ADDR})`, inline: false },
          );
        await interaction.editReply({ embeds: [embed] });
        break;
      }

      case "help": {
        const embed = new EmbedBuilder()
          .setColor(0x6366F1)
          .setTitle("🤖 Nexus AI Bot Komutlari")
          .addFields(
            { name: "/info", value: "Token bilgileri", inline: true },
            { name: "/supply", value: "Toplam arz", inline: true },
            { name: "/staking", value: "Staking durumu", inline: true },
            { name: "/price", value: "Guncel fiyat", inline: true },
            { name: "/contract", value: "Kontrat adresleri", inline: true },
            { name: "/help", value: "Bu menu", inline: true },
          );
        await interaction.editReply({ embeds: [embed] });
        break;
      }
    }
  } catch (e) {
    await interaction.editReply("❌ Bir hata olustu: " + e.message.slice(0, 100));
  }
});

client.login(BOT_TOKEN);
console.log("⚠ Bot token'ini bot.js'deki YOUR_DISCORD_BOT_TOKEN_HERE yerine yapistir.");
console.log("⚠ CLIENT_ID'ini de guncelle.");
