import ChatMessages from './components/ChatMessages';

const ChatPage = () => {
  // You likely get this from the URL params or a state variable
  const activeChatId = "Ka8vWDTn7CyjqDGostyl_kiwi-user-btgod443-gmail-com"; 

  return (
    <div className="chat-container">
      {/* ... your header/sidebar ... */}
      
      {/* This renders the message stream */}
      <ChatMessages chatId={activeChatId} />
      
      {/* ... your input box/send button ... */}
    </div>
  );
};
