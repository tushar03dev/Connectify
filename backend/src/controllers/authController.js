// Sign-up route with phone number validation and OTP
import dotenv from "dotenv";
import {User} from "../models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {sendOTP, verifyOTP} from "./otpController.js";

dotenv.config();

let tempUser = {};

export const signUp = async (req, res) => {

    const { name, email, password} = req.body;
    console.log('Received data:', { name, email, password}); // Log received data

    // Check for missing fields
    if (!name || !email || !password) {
        return res.status(400).send('All fields are required.');
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).send('User already exists. Please sign in.');
        }

        // Temporarily store user data
        tempUser = { name, email, password};

        const otpToken = await sendOTP(email); // Call sendOTP directly
        return res.status(200).json({ otpToken, message: 'OTP sent to your email. Please enter the OTP to complete sign-up.' });

    } catch (err) {
        console.error('Error creating user:', err);
        res.status(500).send('Error creating user');
    }
};

// OTP verification route
export const completeSignUp = async (req, res) => {
    const { otpToken, otp } = req.body;

    if (!otpToken || !otp) {
        res.status(400).json({ message: 'Token and OTP are required.' });
        return;
    }

    try {

        const otpVerificationResult = await verifyOTP(otpToken, otp);

        // If OTP verification was successful, proceed with account creation
        if (otpVerificationResult.success) {
            if (!tempUser) {
                return res.status(400).json({message: 'No user details found for OTP verification.'});
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash(tempUser.password, 10);

            // Create the new user
            const user = new User({ name: tempUser.name, email: tempUser.email, password: hashedPassword });
            await user.save();

            // Clear the tempUser once sign-up is complete
            tempUser = null;

            // Generate JWT token
            const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

            // Respond with token and success message
            res.status(201).json({ token, message: 'OTP verified successfully.User signed up successfully.' });
        } else {
            // OTP verification failed
            res.status(400).json({ message: otpVerificationResult.message });
        }

    } catch (err) {
        console.error('Error verifying OTP:', err);
        res.status(500).send('Error verifying OTP');
    }
}    ;

// Sign-in route
 export const signIn = async (req, res) => {
    const { email, password } = req.body;
    try {

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).send('User does not exist. Please sign up.');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).send('Invalid password');
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, name:user.name });
    } catch (err) {
        console.error('Error during sign-in:', err);
        res.status(500).send('Error during sign-in');
    }
};