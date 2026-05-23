export enum Role {
  User = 'user',
  Bot = 'bot',
}

export interface Message {
  role: Role;
  content: string;
  imageUrl?: string;
  prompt?: string;
}

export const aiChatService = {
  sendMessage: async (messages: Message[]): Promise<string> => {
    const lastMessage = messages[messages.length - 1];
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return `This is a mock response to: "${lastMessage.content}"`;
  }
};
