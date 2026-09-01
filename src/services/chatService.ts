import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  limit,
  Timestamp
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { ChatThread, ChatMessage } from '../types';

export const chatService = {
  // Get or create a chat thread between a user and a vendor
  async getOrCreateChat(userId: string, vendorId: string, userName: string, vendorName: string): Promise<string> {
    const chatsRef = collection(db, 'chats');
    const q = query(
      chatsRef, 
      where('userId', '==', userId),
      where('vendorId', '==', vendorId)
    );
    
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      return snapshot.docs[0].id;
    }
    
    // Create new thread
    const newChat: Omit<ChatThread, 'id'> = {
      participants: [userId, vendorId],
      userId,
      vendorId,
      userName,
      vendorName,
      lastMessage: '',
      lastMessageAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const docRef = await addDoc(chatsRef, newChat);
    return docRef.id;
  },

  // Send a message
  async sendMessage(chatId: string, sender: string, senderType: 'user' | 'vendor', text: string, participants: string[]) {
    const messagesRef = collection(db, 'chat_messages');
    const timestamp = new Date().toISOString();
    
    const newMessage: Omit<ChatMessage, 'id'> = {
      chatId,
      text,
      sender,
      senderType,
      timestamp,
      participants // Required by security rules
    };
    
    await addDoc(messagesRef, newMessage);
    
    // Update thread's last message
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      lastMessage: text,
      lastMessageAt: timestamp,
      updatedAt: timestamp
    });
  },

  // Listen to messages in a chat
  subscribeToMessages(chatId: string, userId: string, callback: (messages: ChatMessage[]) => void) {
    const q = query(
      collection(db, 'chat_messages'),
      where('chatId', '==', chatId),
      where('participants', 'array-contains', userId),
      orderBy('timestamp', 'asc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ChatMessage));
      callback(messages);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'chat_messages');
    });
  },

  // Listen to chat threads for a user
  subscribeToUserChats(userId: string, callback: (chats: ChatThread[]) => void) {
    const q = query(
      collection(db, 'chats'),
      where('userId', '==', userId),
      where('participants', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const chats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ChatThread));
      callback(chats);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'chats');
    });
  },

  // Listen to chat threads for a vendor
  subscribeToVendorChats(vendorId: string, callback: (chats: ChatThread[]) => void) {
    const q = query(
      collection(db, 'chats'),
      where('vendorId', '==', vendorId),
      where('participants', 'array-contains', vendorId),
      orderBy('updatedAt', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const chats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ChatThread));
      callback(chats);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'chats');
    });
  }
};
