import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
const env = process.env.NODE_ENV;
dotenv.config({ path: `.env.${env}` });

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: true,
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS,
    },
});

export default transporter;
