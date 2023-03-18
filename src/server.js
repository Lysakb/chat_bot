const express = require('express');
const http = require('http');
const path = require('path');
const session = require('express-session');
const moment = require('moment');
const menuFood = require('./helper/restaurantMenu.json');

require('dotenv').config();

const messageTime = (user, message) => {
 return {
     user,
     message,
     time: moment().format('h:mm a'),
 };
}

const PORT = process.env.PORT;


const app = express();
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));


const sessionMiddleWare = session({
      secret: process.env.SECRET,
      resave: false,
      saveUninitialized: true,
}); 

app.use(sessionMiddleWare);
io.use((socket, next) => {
      return sessionMiddleWare(socket.request, socket.request.res, next);
});


io.on('connection', (socket) => {
      console.log('user connected successfully', socket.id);

      const botName = 'Chat-Bot';
      const orderHistory = [];
      let switchExecuted = false;

      const botMessage = (message) => {
            socket.emit('bot-message', messageTime(botName, message));
      };

      botMessage(
            `Welcome to ${botName}..<br> Please enter your Name?`
      );

      socket.request.session.currentOrder = [];
      let username = '';
      let optionMenu = '';

      socket.on('chat-message', (msg) => {
            if (!username) {
                  username = msg;
                  io.emit('bot-message', messageTime(username, msg));
                  botMessage(
       `Hello <b>${username}</b>,
       </br></br>
        Select:
        <p></br><b>1</b> to place an order,</p>
        <p><b>99</b> to checkout your order.</p> 
        <p><b>98</b> to see your order history.</p> 
        <p><b>97</b> to see your current order. </p>
        <p><b>0</b> to cancel order.</p>`
      );
        } else {
                  io.emit('bot-message', messageTime(username, msg));
                  switch (msg) {
                        case '1':
                              optionMenu = menuFood.map(
                                    (item) =>
                                          `<p> Select:</br>
                                           <b> ${item.id}</b> for <b>${item.food}</b></p>`
                              ).join('\n');

                              botMessage(
                                    `List of available items: <p>${optionMenu}</p>`
                              );
                              switchExecuted = true;
                              break;
                        case '3':
                        case '4':
                        case '5':
                        case '6':
                        case '7':
                        case '8':
                              if (switchExecuted === false) {
                                    botMessage(
                                          '<b>Press 1 to see menu options</b>'
                                    );
                              } else {
                                    const userInput = Number(msg);
                                    const menu = menuFood.find(
                                          (item) => item.id === userInput
                                    );
                                    if (menu) {
                                          socket.request.session.currentOrder.push(
                                                menu
                                          );
                                          botMessage(
                                                `<b>${menu.food}</b> has been added to your cart <br/>
                                                <br/>If you want to add more to your shopping cart, please type in an order number. <ul>${optionMenu}</ul>
                                                 <br/>Type <b>97</b> to view all your items in cart</br> Or <b>99</b> to check out your order.`
                                          );
                                    } else {
                                          botMessage(
                                                '<b>Please input a correct order</b>'
                                          );
                                    }
                              }
                              break;
                        case '97':
                              if (
                                    socket.request.session.currentOrder
                                          .length === 0
                              ) {
                                    botMessage(
                                          'Cart is empty. Please place an order in the cart.'
                                    );
                              } else {
                                    const currentOrderText =
                                          socket.request.session.currentOrder
                                                .map((item) => item.food)
                                                .join(', ');
                                    botMessage(
                                          `Your current order:<br/><br/> <b>${currentOrderText}</b>`
                                    );
                              }
                              break;
                        case '98':
                              if (!orderHistory.length) {
                                    botMessage(
                                          'Your order history is empty. Kindly place an order'
                                    );
                              } else {
                                    const orderHistoryText = orderHistory
                                          .map(
                                                (order, index) =>
                                                      `Order ${index + 1}: ${
                                                            order.food
                                                      }<br/>`
                                          )
                                          .join('\n');

                                    botMessage(
                                          `Your order history: <br/><br/>${orderHistoryText}`
                                    );
                              }
                              break;
                        case '99':
                              if (
                                    socket.request.session.currentOrder
                                          .length === 0
                              ) {
                                    botMessage(
                                          'Orders cannot be placed with an empty cart. Please add to your cart.'
                                    );
                              } else {
                                    orderHistory.push(
                                          ...socket.request.session.currentOrder
                                    );
                                    botMessage(
                                          'Order placed!'
                                    );
                                    socket.request.session.currentOrder = [];
                              }
                              break;
                        case '0':
                              if (
                                    socket.request.session.currentOrder
                                          .length === 0
                              ) {
                                    botMessage(
                                          'Cart is empty! No order to cancel'
                                    );
                              } else {
                                    socket.request.session.currentOrder = [];
                                    botMessage(
                                          'Your order is cancelled! You can still place an order.<br /> <b> Press 1</b> to view menu'
                                    );
                              }
                              break;
                        default:
                              botMessage(
                                    'Invalid order number. Please try again'
                              );
                  }
            }
      });

      socket.on('disconnect', () => {
            console.log('user is disconnected');
      });
});

server.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
});