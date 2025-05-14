import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const AES_KEY = crypto.scryptSync(process.env.SECRET_KEY || 'default_secret', 'salt', 32);
const IV_LENGTH = 16;

export function encryptText(text: string): { encryptedData: string; iv: string } {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', AES_KEY, iv);
    let encrypted = cipher.update(text, 'utf-8', 'hex');
    encrypted += cipher.final('hex');
    return { encryptedData: encrypted, iv: iv.toString('hex') };
}

export function decryptText(encryptedData: string, iv: string): string {
    const decipher = crypto.createDecipheriv('aes-256-cbc', AES_KEY, Buffer.from(iv, 'hex'));
    let decrypted = decipher.update(encryptedData, 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');
    return decrypted;
}
