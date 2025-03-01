import { Client, GatewayIntentBits } from 'discord.js';
import { describe, it, expect, beforeAll } from 'vitest';
import { createSignatureThread } from './bot'; // Assurez-vous que cette fonction est bien exportée

describe('Bot', () => {
    let client;

    beforeAll(() => {
        client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildMembers,
            ],
        });
    });

    it('should create a signature thread', async () => {
        const channelId = 'your_channel_id_here'; // Remplacez par un ID de canal valide
        const thread = await createSignatureThread(channelId);
        expect(thread).toBeDefined();
        expect(thread.name).toBe('Signature Thread');
    });
}); 