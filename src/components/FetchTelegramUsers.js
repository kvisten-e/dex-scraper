import fs from 'fs/promises'
import axios from "axios"

const TOKEN = import.meta.env.VITE_TELEGRAM_BOT
const URL = `https://api.telegram.org/bot${TOKEN}/getUpdates`;

async function getUpdates(offset) {
  try {
    const response = await axios.get(URL, {
      params: {
        offset: offset
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching updates:', error);
  }
}

export default async function fetchTelegramData() {
  let offset = null;
  while (true) {
    const updates = await getUpdates(offset);
    if (updates && updates.result) {
      for (const update of updates.result) {
        offset = update.update_id + 1;
        handleUpdate(update);
      }
    }
  }
}

function handleUpdate(update) {
  if (update.message) {
    const message = update.message;
    const userId = message.from.id;
    const messageId = message.message_id;

    saveMessageId(userId, messageId);
  }
}

function saveMessageId(userId, messageId) {
  const filename = '../data/telegram.json';
  let data = {};

  // Läs in befintliga data om filen existerar
  if (fs.existsSync(filename)) {
    const fileData = fs.readFileSync(filename, 'utf8');
    data = JSON.parse(fileData);
  }

  // Uppdatera data med nya meddelande-ID:t
  if (data[userId]) {
    data[userId].push(messageId);
  } else {
    data[userId] = [messageId];
  }

  // Skriv tillbaka data till filen
  fs.writeFileSync(filename, JSON.stringify(data, null, 4), 'utf8');
}


