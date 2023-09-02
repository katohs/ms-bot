const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const AWS = require('aws-sdk');


require('dotenv').config();



const bot_token = process.env.BOT_TOKEN
const allowed_channel_id = process.env.CHANNEL_ID
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

AWS.config.update({
  region: 'ap-northeast-1',
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SELECT_SECRET,
});


const params = {
  InstanceIds: [process.env.INSTANCE_ID],
};

const ec2 = new AWS.EC2();

let instanceStatus = 'unknown';

client.on('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  instanceStatus = await getEC2InstanceStatus();
  setBotStatus();
  console.log(`EC2インスタンスのステータス: ${instanceStatus}`);
});

client.on('messageCreate', async message => {
  if (message.channel.id !== allowed_channel_id) return
  if (message.content === '!ping') {
    const pong = await message.channel.send('pong');
    console.log(pong.content); // pong
  } else if (message.content === '!stop') {
    stopEC2Instance(message);
  } else if (message.content === '!start') {
    startEC2Instance(message);
  }
});

client.login(bot_token);

async function stopEC2Instance(message) {
  try {
    const data = await ec2.stopInstances(params).promise();
    console.log('EC2 instance stopping:', data);
    message.reply('EC2インスタンスを停止しました。');
    instanceStatus = 'stopped';
    await setBotStatus();
  } catch (err) {
    console.error('Error stopping EC2 instance:', err);
    message.reply('EC2インスタンスの停止に失敗しました。エラー: ' + err.message);
  }
}

async function startEC2Instance(message) {
  try {
    const data = await ec2.startInstances(params).promise();
    console.log('EC2 instance running:', data);
    message.reply('EC2インスタンスを起動しました。');

    instanceStatus = 'running';
    await setBotStatus();
  } catch (err) {
    console.error('Error running EC2 instance:', err);
    message.reply('EC2インスタンスの起動に失敗しました。エラー: ' + err.message);
  }
}

async function getEC2InstanceStatus() {
  try {
    const data = await ec2.describeInstances(params).promise();
    const status = data.Reservations[0].Instances[0].State.Name;
    return status;
  } catch (err) {
    console.error('Error describing EC2 instance:', err);
    return 'unknown';
  }
}


async function setBotStatus() {
  console.log('instanceStatus', instanceStatus)
  if (instanceStatus === 'running') {
    statusText = '起動中';
  }
  else if (instanceStatus === 'stopped') {
    statusText = '停止中';
  }
  else {
    statusText = '不明';
  }

  console.log('statusText', statusText)
  client.user.setPresence({
    activities: [{
      name: statusText, type: ActivityType.Playing
    }],
    status: 'online',
  });

}
