const User = require("../models/userSchema");
const Wallet = require("../models/walletSchema");
const crypto = require("crypto");

/**
 * Generates a unique referral code.
 */
const generateReferralCode = () => {
    return crypto.randomBytes(4).toString("hex").toUpperCase();
};

/**
 * Processes the referral reward for both referrer and referee.
 * @param {string} referralCode - The referral code used by the new user.
 * @param {string} newUserId - The ID of the newly registered user.
 */
const processReferral = async (referralCode, newUserId) => {
    try {
        if (!referralCode) return;

        const referrer = await User.findOne({ referalCode: referralCode });
        if (!referrer) {
            console.log("Invalid referral code:", referralCode);
            return;
        }

        const newUser = await User.findById(newUserId);
        if (!newUser || newUser.redeemed) {
            console.log("User already redeemed or not found");
            return;
        }

        // Reward amount settings
        const REFERRER_REWARD = 100;
        const REFEREE_REWARD = 50;

        // 1. Credit Referrer's Wallet
        let referrerWallet = await Wallet.findOne({ userId: referrer._id });
        if (!referrerWallet) {
            referrerWallet = new Wallet({ userId: referrer._id, totalBalance: 0 });
        }
        referrerWallet.totalBalance += REFERRER_REWARD;
        referrerWallet.transactions.push({
            type: 'Referal',
            amount: REFERRER_REWARD,
            date: new Date(),
            description: `Referral reward for inviting ${newUser.email}`,
            status: 'Completed'
        });
        await referrerWallet.save();

        // 2. Credit Referee's Wallet
        let refereeWallet = await Wallet.findOne({ userId: newUser._id });
        if (!refereeWallet) {
            refereeWallet = new Wallet({ userId: newUser._id, totalBalance: 0 });
        }
        refereeWallet.totalBalance += REFEREE_REWARD;
        refereeWallet.transactions.push({
            type: 'Referal',
            amount: REFEREE_REWARD,
            date: new Date(),
            description: `Referral reward for joining via ${referrer.email}`,
            status: 'Completed'
        });
        await refereeWallet.save();

        // 3. Update User models
        referrer.redeemedUsers.push(newUser._id);
        await referrer.save();

        newUser.redeemed = true;
        await newUser.save();

        console.log(`Referral processed: Referrer (${referrer.email}) rewarded ${REFERRER_REWARD}, Referee (${newUser.email}) rewarded ${REFEREE_REWARD}`);

    } catch (error) {
        console.error("Error processing referral:", error);
    }
};

module.exports = {
    generateReferralCode,
    processReferral
};
