// import exposeLocation from './geolocation.js';
const socket = io();
const smForm = document.getElementById('send-msg-form');
const smInput = document.getElementById('send-msg-input');
const shareLocationBtn = document.getElementById('share-location');
const massagesContainer = document.getElementById('messages');
const usersBar = document.getElementById('users');

const prepareUserData = () => {
  const params = new URLSearchParams(document.location.search.slice(1));
  const username = params.has('username') ? params.get('username') : '';
  const room = params.has('room') ? params.get('room') : '';

  if (username && room) {
    return {
      username,
      room,
    };
  }
};

const userData = prepareUserData();

const sendMessage = () => {
  event.preventDefault();
  const msg = smInput.value;
  const controls = event.target.querySelectorAll('button, input');

  function toggleDisabled() {
    controls.forEach(element => {
      element.disabled = !element.disabled;
    });
  }

  if (msg) {
    toggleDisabled();
    socket.emit('sendMessage', msg, (massage) => {
      toggleDisabled();
      smInput.value = '';
      smInput.focus();
    });
  }
};

const shareMyLocation = () => {
  if (!navigator.geolocation) {
    return alert('Geolocation is not supported in your browser');
  }
  shareLocationBtn.disabled = true;
  navigator.geolocation.getCurrentPosition(position => {
    socket.emit('shareLocation', {
      lat: position.coords.latitude,
      long: position.coords.longitude
    }, (message) => {
      shareLocationBtn.disabled = false;
    });
  });
};

const autoScroll = () => {
  // New message element
  const $newMessage = massagesContainer.lastElementChild

  // Height of the new message
  const newMessageStyles = getComputedStyle($newMessage)
  const newMessageMargin = parseInt(newMessageStyles.marginBottom)
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

  // Visible height
  const visibleHeight = massagesContainer.offsetHeight

  // Height of messages container
  const containerHeight = massagesContainer.scrollHeight

  // How far have I scrolled?
  const scrollOffset = massagesContainer.scrollTop + visibleHeight

  if (containerHeight - newMessageHeight <= scrollOffset) {
    massagesContainer.scrollTop = massagesContainer.scrollHeight
  }
}

const createMsgElm = msgObj => {
  const messageElm = document.createElement('div');
  const username = msgObj.user ? `From: <strong class="user-name">${msgObj.user}</strong> ` : '';
  messageElm.classList.add('message-text');
  messageElm.innerHTML = `
    <p class="message-text__meta">
      ${username}${createDate(msgObj.createdAt)}
    </p>
    <p>
      ${msgObj.text}
    </p>
  `;
  return messageElm;
};

const createLocationElm = locationObj => {
  const messageElm = document.createElement('div');
  const username = locationObj.user ? `From: <strong class="user-name">${locationObj.user}</strong> ` : '';
  messageElm.classList.add('message-text');
  messageElm.innerHTML = `
    <p class="message-text__meta">
      ${username}${createDate(locationObj.createdAt)}
    </p>
    <p>
      <a target="_blank" href="${locationObj.text}">My current location<a>
    </p>
  `;
  return messageElm;
};

const createDate = date => {
  const dateTime = new Date(date); // HTMLDateElement
  const formattedDate = dateTime.toLocaleDateString();
  const formattedTime = dateTime.toLocaleTimeString();

  return `<span class="date">${formattedDate}, at: ${formattedTime} </span> `;
};

const renderUsersList = users => {
  
  if (users.length) {
    let usersList = document.querySelector('.users-list');
    
    if (!usersList) {
      usersList = document.createElement('ul');
      usersList.classList.add('users-list');
      usersBar.append(usersList);
    }
    
    users.forEach(user => {
      const listItem = document.createElement('li');
      const itemContent = `${user.username}`;
      listItem.classList.add('users-list__item');
      listItem.id = 'id-' + user.id;
      listItem.innerHTML = itemContent;

      if (!usersList.querySelector(`#id-${user.id}`)) {
        usersList.append(listItem);
      }
    });
  }
};

const removeUserFromList = user => {
  let usersList = document.querySelector('.users-list');
  
  if (usersList) {
    const userElm = usersList.querySelector(`#id-${user.id}`);
    userElm.remove();
  }
};

const renderRoomTitle = title => {
  const roomTitle = document.createElement('h2');
  roomTitle.classList.add('users-room-title');
  roomTitle.innerText = `${title} Room Users:`;
  usersBar.prepend(roomTitle);
};

const insertMessage = message => {
  const messageElm = createMsgElm(message);
  massagesContainer.append(messageElm);
}

const insertLocation = locationMsg => {
  const locationElm = createLocationElm(locationMsg);
  massagesContainer.append(locationElm);
}

socket.on('message', msg => {
  insertMessage(msg);
  autoScroll();
});
socket.on('locationMessage', location => {
  insertLocation(location);
  autoScroll();
});
socket.on('userJoinedRoom', data => renderUsersList(data.users));
socket.on('userLeftRoom', data => removeUserFromList(data.user));


if (userData) {
  renderRoomTitle(userData.room);
  socket.emit('join', userData, (error) => {
    if (error) {
      alert(error);
      window.location.href = '/';
    }
  });
}

smForm.addEventListener('submit', sendMessage);
shareLocationBtn.addEventListener('click', shareMyLocation);