/**
 * Collection of random reusable email functions
 */
const nodemailer = require('nodemailer');

module.exports = {
    sendEmail: (toAddress, subjectStr, bodyStr, successRoute = 'back', failureRoute = 'back') => {
        var transporter = nodemailer.createTransport({
            host: "smtp-mail.outlook.com", // hostname
            secureConnection: false, // TLS requires secureConnection to be false
            port: 587, // port for secure SMTP
            tls: {
                ciphers: 'SSLv3'
            },
            auth: {
                user: process.env.NOREPLY_EMAIL,
                pass: process.env.NOREPLY_PW,
            }
        });

        const mailOptions = {
            from: 'noreply@playvested.com',
            to: toAddress,
            subject: subjectStr,
            html: bodyStr,
        };

        return transporter.sendMail(mailOptions);
    },
}
