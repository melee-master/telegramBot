const express = require('express');
const { Telegraf } = require('telegraf');
const app = express();
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const bot = new Telegraf('6252053857:AAFkZGnPDKV788SyLoKtH21zUwj2CwvNMZw');
const botToken = "6252053857:AAFkZGnPDKV788SyLoKtH21zUwj2CwvNMZw";
const group = require('./db/model');
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
const connectDB = require("./db/connect");
const mongoose = require('mongoose');

app.use(express.json());
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));


const start = async () => {
  console.log("Here 2")
  try {
    // console.log("HERE")
    // await connectDB("mongodb+srv://gaurav0:kumar@cluster0.u5wuwsm.mongodb.net/?retryWrites=true&w=majority");


    try {
      await mongoose.connect("mongodb://gaurav0:kumar@ac-3wtgv1n-shard-00-00.u5wuwsm.mongodb.net:27017,ac-3wtgv1n-shard-00-01.u5wuwsm.mongodb.net:27017,ac-3wtgv1n-shard-00-02.u5wuwsm.mongodb.net:27017/?ssl=true&replicaSet=atlas-8zzpqy-shard-0&authSource=admin&retryWrites=true&w=majority");
      console.log("Connected to MongoDB");
    } catch (err) {
      console.error("Error connecting to MongoDB:", err);
    }
    const port = 3000;
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
    console.log("Connected to DB");
  } catch (e) {
    console.log(e);
  }
}






// Replace 'YOUR_TELEGRAM_BOT_TOKEN' with your actual bot token
const groupIds = ['-1001829501241', '-800660927'];
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

app.get('/sendMessage', async (req, res) => {
  const message = "sent via bot";
  const _groups = await group.find({}, 'groupId');
  console.log(_groups);
  for (let i = 0; i < _groups.length; i++) {
    try{
      console.log("**************************")
      console.log(_groups[i].groupId);
      await bot.telegram.sendMessage(_groups[i].groupId, message);

      console.log(">>>>>>>>>>>>>>>>>>>>>>>")
    }catch(error){
      console.log(error);
    }
    
  }
  res.status(200).send({ message: 'sent successfully' });

})
//https://api.telegram.org/bot6252053857:AAFkZGnPDKV788SyLoKtH21zUwj2CwvNMZw/getUpdates
 
app.get('/addMember', async(req, res) => {
  const apiUrl = `https://api.telegram.org/bot${botToken}/getUpdates`;
  let responseGroupId;
  try {
    const response = await axios.get(apiUrl)
    console.log(response.data)
    console.log(responseGroupId); 

    updates = response.data.result;
    if (updates.length > 0) {
      const chatId = updates[0].message.chat.id;
      console.log( chatId);
    }
  } catch (error) {
    console.error('Failed to retrieve group chat ID:', error);
  }
  res.status(200).send({message : updates});
})
app.get('')
app.post('/send-image', upload.single('image'), async (req, res) => {
  // Replace with your Telegram group ID
  const imageFilePath = req.file.path;

  try {
    const formData = new FormData();
    formData.append('photo', fs.createReadStream(imageFilePath));
    let response;
    for (let i = 0; i < groupIds.length; i++) {
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




bot.on('message', async (ctx) => {
  const chatId = ctx.message.chat.id;
  const chatName = ctx.message.chat.title; 

  console.log('Group Name:', chatName);
  console.log('Group ID:', chatId);

  // const Group = new group({
  //   groupId: chatId,
  //   groupName: chatName,
  // });

  try {
    // Check if a document with the given groupId already exists
    const existingGroup = await group.findOne({ groupId: chatId });

    if (!existingGroup) {
      // Create a new group document
      const Group = new group({
        groupId: chatId,
        groupName: chatName,
      });

      // Save the group document to the database
      await Group.save();
      console.log('Group information saved to MongoDB');
    } else {
      console.log('Group already exists in MongoDB');
    }
  } catch (error) {
    console.error('Failed to save group information:', error);
  }
});
// Start the bot
bot.launch();
start();
// Start the server
