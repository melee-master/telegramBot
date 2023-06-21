const express = require('express');
const { Telegraf } = require('telegraf');
const app = express();
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const bot = new Telegraf('6252053857:AAFkZGnPDKV788SyLoKtH21zUwj2CwvNMZw');
const botToken = "6252053857:AAFkZGnPDKV788SyLoKtH21zUwj2CwvNMZw";
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

// Replace 'YOUR_TELEGRAM_BOT_TOKEN' with your actual bot token
const groupIds = ['-1001829501241'];
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit for image size
  },
});
async function getTelegramGroups(botToken) {
  const apiUrl = `https://api.telegram.org/bot${botToken}/getUpdates`;
  try {
    const response = await axios.get(apiUrl);
    const updates = response.data.result;
    const groups = [];
    for (const update of updates) {
      if (update.message && update.message.chat && update.message.chat.type === 'group') {
        groups.push(update.message.chat);
      }
    }
    console.log("here");
    console.log(updates)
    return groups;
  } catch (error) {
    console.error('Failed to retrieve Telegram groups:', error);
    return [];
  }
}

async function getJoinedGroups(botToken) {
    const apiUrl = `https://api.telegram.org/bot${botToken}/getMyCommands`;
    try {
      const response = await axios.get(apiUrl);
      const commands = response.data.result;
      const groups = [];
      for (const command of commands) {
        const groupId = command.scope.chat_id;
        if (groupId) {
          groups.push(groupId);
        }
      }
      return groups;
    } catch (error) {
      console.error('Failed to retrieve joined groups:', error);
      return [];
    }
  }
  
  // API endpoint to get all groups
  app.get('/getAllGroups', async (req, res) => {
    try {
      const groups = await getJoinedGroups(botToken);
      res.json({ groups });
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve joined groups' });
    }
  });

// Render the form with groups
app.get('/', async (req, res) => {
  try {
    const groups = await getTelegramGroups(botToken);
    res.render('imageUploader', { groups });
  } catch (error) {
    res.render('error', { message: 'Failed to retrieve Telegram groups' });
  }
});

// Handle the form submission
app.post('/join-group', async (req, res) => {
  const groupId = req.body.groupId;
  const userId = 'YOUR_TELEGRAM_USER_ID'; // Replace with your Telegram user ID

  try {
    const member = await bot.telegram.getChatMember(groupId, userId);
    if (member) {
      res.render('result', { message: 'You are already a member of the group!' });
    }
  } catch (error) {
    if (error.code === 403) {
      try {
        await bot.telegram.joinChat(groupId);
        res.render('result', { message: 'You have been added to the group!' });
      } catch (joinError) {
        res.render('result', { message: 'Failed to join the group. Please check the group ID.' });
      }
    } else {
      res.render('result', { message: 'Failed to check membership status.' });
    }
  }
});

app.get('/sendMessage', async(req, res)=> {
  const message = "sent via bot";
  for(let i=0; i<groupIds.length; i++){
    bot.telegram.sendMessage(groupIds[i], message);
  }
  res.status(200).send({message : 'sent successfully'});

})

app.post('/send-image', upload.single('image'), async (req, res) => {
   // Replace with your Telegram group ID
  const imageFilePath = req.file.path;

  try {
    const formData = new FormData();
    formData.append('photo', fs.createReadStream(imageFilePath));
    let response;
    for(let i=0; i<groupIds.length; i++){
      const groupId = groupIds[i];
      response = await axios.post(`https://api.telegram.org/bot${botToken}/sendPhoto?chat_id=${groupId}`, formData, {
      headers: formData.getHeaders(),
      });

    

    }
    

    const result = await response.data;
    console.log(result);

    // Handle the result or send a response to the client
    res.json({ message: 'Image sent successfully!' });
  } catch (error) {
    console.error('Failed to send image:', error);
    res.status(500).json({ error: 'Failed to send image. Please try again.' });
  }
});

// Start the bot
bot.launch();

// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});