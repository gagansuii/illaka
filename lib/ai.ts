import { OpenAI } from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';

let openaiClient: OpenAI | null = null;
let pineconeClient: Pinecone | null = null;

import { getEnv } from './config';

export function isOpenAIConfigured() {
  try {
    getEnv('OPENAI_API_KEY');
    return true;
  } catch {
    return false;
  }
}

export function isPineconeConfigured() {
  try {
    getEnv('PINECONE_API_KEY');
    getEnv('PINECONE_INDEX');
    return true;
  } catch {
    return false;
  }
}

export function getOpenAIClient() {
  const apiKey = getEnv('OPENAI_API_KEY');
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey, timeout: 8_000, maxRetries: 2 });
  }
  return openaiClient;
}

export function getPineconeIndex() {
  const apiKey = getEnv('PINECONE_API_KEY');
  const indexName = getEnv('PINECONE_INDEX');
  if (!pineconeClient) {
    pineconeClient = new Pinecone({ apiKey });
  }
  return pineconeClient.index(indexName);
}
