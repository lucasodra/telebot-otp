    require('dotenv').config();
    const axios = require('axios');
    const TelegramBot = require('node-telegram-bot-api');
    const bot = new TelegramBot(process.env.TELEBOT_ACCESS_KEY, {polling: true});


    // basic port binding to fulfill heroku
    var express = require('express');
    var cookieParser = require('cookie-parser');
    var app = express();

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());
    
    app.get('/', function (req, res) {
        res.send('Hello World!');
    });

    app.post('/send', function (req, res) {
        console.log(req.body);
        const { telegramId, code } = req.body;

        bot.sendMessage(telegramId, "OTP: " + code, {});
        res.status(200).send("ok");
    });

    var port = process.env.PORT || 3000;
    app.listen(port, function () {
        console.log('TELE OTP app listening on port ' + process.env.PORT);
    });

    bot.onText(/\/start/, (msg) => {
        const chatId = msg.chat.id;
        let userId = chatId;
        console.log('### USER:' + userId);
        try {
            bot.sendMessage(userId, "Lets start with linking your contact number!", {
                "reply_markup": {
                    "one_time_keyboard": true,
                    "keyboard": [[{
                        text: "Continue by sharing my contact",
                        request_contact: true,
                        one_time_keyboard: true,
                    }], ["I do not wish to participate"]]
                }
            });
        } catch (err) {
            console.log('###' + err);
        }
    });


    bot.on("polling_error", console.log);

    bot.on('contact', (msg) => {
        const userId = msg.from.id;
        const contact = msg.contact;

        console.log(`Received contact: ${contact.phone_number} ${contact.first_name}`);

        const dataToSend = {
            token: process.env.SERVER_KEY,
            contact: contact.phone_number,
            telegramId: userId
          };
          
        axios.post(process.env.SERVER_URL, dataToSend)
            .then(response => {
            console.log('Data:', response.data);
            })
            .catch(error => {
            console.error('Error sending POST request:', error);
            });
            
        try {
            const removeOpts = {
                reply_markup: {
                    remove_keyboard: true
                }
            }      
            bot.sendMessage(userId, `We have set your phone to receive OTP via Tixar_bot.`, removeOpts);
        } catch (err) {
            console.log('###' + err);
        }
    });