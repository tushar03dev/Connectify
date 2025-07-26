import transporter from '../config/nodemailerConfig';
import dotenv from 'dotenv';

const env = process.env.NODE_ENV;
dotenv.config({ path: `.env.${env}` });

// Generate and send OTP
export const sendOTP = async (email: string) => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Send OTP via email
    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your Connectify verification OTP Code',
        text: `Your OTP code is ${otp}. It will expire in 5 minutes.`,
    });

    return otp;
};

export const passwordResetMail = async (email: string) => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Send OTP via email
    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your Connectify Password Recovery OTP Code',
        text: `Your OTP code is ${otp}. It will expire in 5 minutes.`,
    });

    return otp;
};
