import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const AES_KEY = crypto.scryptSync(process.env.SECRET_KEY as string, 'salt', 32);
const IV_LENGTH = 16;

export function encryptImage(buffer: Buffer): { encryptedData: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-gcm', AES_KEY, iv);
    let encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
    return {
        encryptedData: encrypted.toString('hex'),
        iv: iv.toString('hex'),
        tag: cipher.getAuthTag().toString('hex')
    };
}

export function decryptImage(encryptedData: string, iv: string, tag: string): Buffer {
    const decipher = crypto.createDecipheriv('aes-256-gcm', AES_KEY, Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(tag, 'hex'));
    let decrypted = Buffer.concat([decipher.update(Buffer.from(encryptedData, 'hex')), decipher.final()]);
    return decrypted;
}
