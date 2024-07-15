import fs from 'fs';
import axios from 'axios';
import 'dotenv/config';

const TOKEN = process.env.VITE_TELEGRAM_BOT;
const URL = `https://api.telegram.org/bot${TOKEN}/getUpdates`;

async function getUpdates(offset) {
  try {
    const response = await axios.get(URL, {
      params: {
        offset: offset,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching updates:', error);
  }
}

async function fetchTelegramData() {
  let offset = null;

  while (true) {
    const updates = await getUpdates(offset);
    if (updates && updates.result) {
      for (const update of updates.result) {
        offset = update.update_id + 1;
        handleUpdate(update);
      }
    }
    await new Promise(resolve => setTimeout(resolve, 5000)); // 5-second delay
  }
}

function handleUpdate(update) {
  if (update.message) {
    const message = update.message;
    const userId = message.from.id;
    const username = message.from.username.toLowerCase();

    saveMessageId(userId, username);
  }
}

function saveMessageId(userId, username) {
  const filename = './src/data/telegram.json';
  let data = [];

  // Read existing data if the file exists
  if (fs.existsSync(filename)) {
    const fileData = fs.readFileSync(filename, 'utf8');
    data = JSON.parse(fileData);
  }

  // Check if username already exists in data array
  let userIndex = data.findIndex(item => item.username === username);

  if (userIndex !== -1) {
    // Update userID if username exists
    data[userIndex].userID = userId;
    console.log(`Updated userID for ${username}: ${userId}`);
  } else {
    // Add new user object to the array
    data.push({
      username: username,
      userID: userId
    });
    console.log(`Added new user ${username} with userID: ${userId}`);
  }

  // Write data back to the file
  try {
    fs.writeFileSync(filename, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing to file:', error);
  }
}

fetchTelegramData();
