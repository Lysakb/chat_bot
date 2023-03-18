const chatForm = document.getElementById('form');
const Message = document.getElementById('Chat');
const inputField = document.getElementById('inputMessage');

const socket = io();

socket.on('bot-message', function (msg) {
      handleMessage(msg);
      Message.scrollTop = Message.scrollHeight;
});

const handleMessage = (msg) => {
      const div = document.createElement('div');
      div.classList.add('message');
      div.innerHTML = `
    <p class="user">${msg.user} <span>${msg.time}</span></p>
    <p class="text">${msg.message}</p>
    `;
      //append the div to the messages div
      Message.appendChild(div);
};

// Message submit
chatForm.addEventListener('submit', (e) => {
      e.preventDefault();

      let Msg = e.target.elements.inputMessage.value;

      let Message = Msg.trim();

      if (!Message) {
            alert('Please enter a message');
            return;
      }

      if (Message !== '') {
            //sending Message to the Server
            socket.emit('chat-message', Message);
            // Clear input
            e.target.elements.inputMessage.value = '';
            e.target.elements.inputMessage.focus();
      }
});
