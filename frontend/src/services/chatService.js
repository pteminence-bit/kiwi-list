// src/services/chatService.js
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const sendMessage = async (chatId, text, senderId) => {
  const messagesRef = collection(db, 'chats', chatId, 'messages');
  await addDoc(messagesRef, {
    text: text,
    senderId: senderId,
    createdAt: serverTimestamp()
  });
};
