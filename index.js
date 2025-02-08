const axios = require('axios');
const fs = require('fs');
const figlet = require('figlet');
const chalk = require('chalk');
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

const agents = {
  "deployment_p5J9lz1Zxe7CYEoo0TZpRVay": "Professor 🧠",
  "deployment_7sZJSiCqCNDy9bBHTEh7dwd9": "Crypto Buddy 💰",
  "deployment_SoFftlsf9z4fyA3QCHYkaANq": "Sherlock 🔎"
};

function displayAppTitle() {
  console.log(chalk.cyan(figlet.textSync(' Kite AI ', { horizontalLayout: 'full' })));
  console.log(chalk.dim('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(chalk.dim('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
}

async function sendRandomQuestion(agent) {
  try {
    const randomQuestions = JSON.parse(fs.readFileSync('random_questions.json', 'utf-8'));
    const randomQuestion = randomQuestions[Math.floor(Math.random() * randomQuestions.length)];

    const payload = { message: randomQuestion, stream: false };
    const response = await axios.post(`https://${agent.toLowerCase().replace('_','-')}.stag-vxzy.zettablock.com/main`, payload, {
      headers: { 'Content-Type': 'application/json' }
    });

    return { question: randomQuestion, response: response.data.choices[0].message };
  } catch (error) {
    console.error(chalk.red('⚠️ Error:'), error.response ? error.response.data : error.message);
  }
}

async function reportUsage(wallet, options) {
  try {
    const payload = {
      wallet_address: wallet,
      agent_id: options.agent_id,
      request_text: options.question,
      response_text: options.response,
      request_metadata: {}
    };

    await axios.post(`https://quests-usage-dev.prod.zettablock.com/api/report_usage`, payload, {
      headers: { 'Content-Type': 'application/json' }
    });

    console.log(chalk.green('✅ Data penggunaan berhasil dilaporkan!\n'));
  } catch (error) {
    console.error(chalk.red('⚠️ Gagal melaporkan penggunaan:'), error.response ? error.response.data : error.message);
  }
}

async function main() {
  displayAppTitle();

  // Membaca wallet addresses dari file address.txt
  fs.readFile('address.txt', 'utf-8', (err, data) => {
    if (err) {
      console.error(chalk.red('⚠️ Gagal membaca file address.txt'), err);
      return;
    }

    const wallets = data.split('\n').map(wallet => wallet.trim()).filter(wallet => wallet.length > 0);

    readline.question(chalk.yellow('🔢 Masukkan jumlah iterasi untuk setiap agent: '), async (input) => {
      const iterations = parseInt(input) || 1;
      console.log(chalk.blue(`\n📌 Wallet addresses: ${wallets.join(', ')}`));
      console.log(chalk.blue(`📊 Iterasi per agent: ${iterations}\n`));

      // Loop untuk setiap wallet address
      for (const wallet of wallets) {
        console.log(chalk.magenta(`\n💼 Menggunakan wallet address: ${wallet}`));

        // Loop untuk setiap agent
        for (const [agentId, agentName] of Object.entries(agents)) {
          console.log(chalk.magenta(`\n🤖 Menggunakan Agent: ${agentName}`));
          console.log(chalk.dim('----------------------------------------'));

          for (let i = 0; i < iterations; i++) {
            console.log(chalk.yellow(`🔄 Iterasi ke-${i + 1}`));
            const nanya = await sendRandomQuestion(agentId);
            console.log(chalk.cyan('❓ Pertanyaan:'), chalk.bold(nanya.question));
            console.log(chalk.green('💡 Jawaban:'), chalk.italic(nanya?.response?.content ?? '')) ;

            // Laporan penggunaan untuk setiap wallet
            await reportUsage(wallet.toLowerCase(), {
              agent_id: agentId,
              question: nanya.question,
              response: nanya?.response?.content ?? 'Tidak ada jawaban'
            });
          }

          console.log(chalk.dim('----------------------------------------'));
        }

        console.log('\n🎉 Sesi selesai untuk wallet: ' + wallet);
      }

      console.log('\n🎉 Semua sesi selesai! Terima kasih telah menggunakan Kite AI.');
      readline.close();
    });
  });
}

main();
