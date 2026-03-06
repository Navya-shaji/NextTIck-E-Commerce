const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/userSchema");
const env = require("dotenv").config()

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback",
    passReqToCallback: true
},
    async (req, accessToken, refreshToken, profile, done) => {
        try {
            let user = await User.findOne({ googleId: profile.id });
            if (user) {
                if (!user.referalCode) {
                    const { generateReferralCode } = require("../helpers/referralHelper");
                    user.referalCode = generateReferralCode();
                    await user.save();
                }
                return done(null, user);
            } else {
                const { generateReferralCode, processReferral } = require("../helpers/referralHelper");

                user = new User({
                    name: profile.displayName,
                    email: profile.emails[0].value,
                    googleId: profile.id,
                    referalCode: generateReferralCode(),
                });
                await user.save();

                // Process referral if exists in session
                if (req.session.referralCode) {
                    await processReferral(req.session.referralCode, user._id);
                    delete req.session.referralCode;
                }

                return done(null, user)
            }
        } catch (error) {
            return done(error, null)
        }
    }
));

passport.serializeUser((user, done) => {
    done(null, user._id);
});

passport.deserializeUser((id, done) => {
    User.findById(id).then(user => {
        done(null, user)
    }).catch(err => {
        done(err, null)
    })
})

module.exports = passport;