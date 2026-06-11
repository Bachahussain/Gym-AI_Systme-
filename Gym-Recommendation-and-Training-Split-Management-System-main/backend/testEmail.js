import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, ''),
    },
});

const mailOptions = {
    from: process.env.GMAIL_USER,
    to: process.env.GMAIL_USER,
    subject: 'Test Email',
    text: 'This is a test email.',
};

transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        console.error("Error details:", error);
    } else {
        console.log('Email sent: ' + info.response);
    }
});
