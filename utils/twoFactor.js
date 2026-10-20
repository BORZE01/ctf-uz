const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');

const generateTwoFactorSecret = async (username) => {
    const secret = speakeasy.generateSecret({ name: `CTF.UZ (${username})` });
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
    return { secret: secret.base32, qrCodeUrl };
};

const verifyTwoFactorToken = (secret, token) => {
    if (!secret || !token) return false;
    return speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: String(token).trim(),
        window: 1
    });
};

const generateBackupCodes = (count = 8) => {
    const codes = [];
    for (let i = 0; i < count; i++) {
        codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
};

module.exports = { generateTwoFactorSecret, verifyTwoFactorToken, generateBackupCodes };
