import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OpenAIService {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    // Initialize OpenAI with API key from environment variables
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');

    if (!apiKey || apiKey === 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx') {
      console.warn('OpenAI API key is not set or is using a placeholder. Using fallback responses.');
    }

    this.openai = new OpenAI({
      apiKey: apiKey || 'sk-dummy-key',
    });
  }

  /**
   * Generate a response from OpenAI for the given agent and user message
   * @param agentName The name of the agent
   * @param agentBio The bio of the agent
   * @param userMessage The user's message
   * @returns The generated response
   */
  async generateResponse(agentName: string, agentBio: string[], userMessage: string): Promise<string> {
    try {
      // Create a system message that defines the agent's persona
      const bioText = Array.isArray(agentBio) ? agentBio.join(' ') : agentBio;
      const systemMessage = `You are ${agentName}, a DeFi assistant. ${bioText}
      You specialize in helping users with cryptocurrency and decentralized finance tasks.
      You are knowledgeable about the Open Campus Codex blockchain (chainID: 656476, Currency: EDU).
      Always be helpful, concise, and stay in character.`;

      const apiKey = this.configService.get<string>('OPENAI_API_KEY');

      // If the API key is not set or is a placeholder, use fallback responses
      if (!apiKey || apiKey === 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx') {
        return this.getFallbackResponse(agentName, userMessage);
      }

      try {
        // Call the OpenAI API
        const response = await this.openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemMessage },
            { role: 'user', content: userMessage }
          ],
          temperature: 0.7,
          max_tokens: 500,
        });

        // Return the generated text
        return response.choices[0].message.content || 'I apologize, but I could not generate a response.';
      } catch (apiError) {
        console.error('Error calling OpenAI API:', apiError);
        return this.getFallbackResponse(agentName, userMessage);
      }
    } catch (error) {
      console.error('Error generating response from OpenAI:', error);
      return `I apologize, but I encountered an error while processing your request. Please try again later.`;
    }
  }

  /**
   * Get a fallback response when OpenAI is not available
   * @param agentName The name of the agent
   * @param userMessage The user's message
   * @returns A fallback response
   */
  private getFallbackResponse(agentName: string, userMessage: string): string {
    // Simple fallback responses based on the user's message
    if (userMessage.toLowerCase().includes('hello') || userMessage.toLowerCase().includes('hi')) {
      return `Hello! I'm ${agentName}, a DeFi assistant specialized in the Open Campus Codex blockchain. I can help you with tasks like checking balances, transferring tokens, and providing information about the EDU currency. How can I assist you today?`;
    } else if (userMessage.toLowerCase().includes('what can you do')) {
      return `As ${agentName}, I can help you with various DeFi operations on the Open Campus Codex blockchain (chainID: 656476), including:

1. Providing information about EDU tokens and their current market status
2. Explaining how to transfer tokens between wallets
3. Guiding you through swapping tokens on decentralized exchanges
4. Helping you understand yield farming and staking opportunities
5. Explaining blockchain concepts in simple terms

What specific DeFi task would you like help with today?`;
    } else {
      return `I understand you're asking about "${userMessage}". As a DeFi assistant for the Open Campus Codex blockchain, I'd be happy to help with this. Could you provide more details about what you're trying to accomplish so I can give you the most relevant information?`;
    }
  }
}
