const generateMessage = msg => {
  return {
    user: msg.user,
    text: msg.text,
    createdAt: Date.now()
  };
};

module.exports = {generateMessage};
