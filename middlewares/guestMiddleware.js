const User = require("../models/userSchema");
const { v4: uuidv4 } = require("uuid");

const guestMiddleware = async (req, res, next) => {
    try {
        // If user is already logged in (via custom session or passport), skip
        if (req.session.user || (req.session.passport && req.session.passport.user)) {
            const loggedInUser = req.session.user || req.session.passport.user;
            // Ensure req.user is set for convenience if not already
            if (loggedInUser && !req.user) {
                req.user = loggedInUser;
            }
            res.locals.user = loggedInUser;
            res.locals.isGuest = false;
            return next();
        }

        // If not logged in, check for existing guest session
        let guestUserId = req.session.guestUserId;
        let guestUser;

        if (guestUserId) {
            guestUser = await User.findOne({ _id: guestUserId, isGuest: true });
        }

        // If no guest user in DB or session, create one
        if (!guestUser) {
            const guestId = `guest_${uuidv4()}`;
            // Guest expires in 24 hours
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

            guestUser = new User({
                name: "Guest User",
                isGuest: true,
                guestId: guestId,
                expiresAt: expiresAt
            });

            await guestUser.save();
            req.session.guestUserId = guestUser._id;
        }

        // Attach guest user to request and session for consistency
        req.user = guestUser;
        // We don't necessarily want to set req.session.user for guests if it's used to determine "isLoggedIn"
        // But some parts of the code might rely on it. Let's provide a way to distinguish.
        res.locals.isGuest = true;
        res.locals.user = guestUser;

        next();
    } catch (error) {
        console.error("Error in guestMiddleware:", error);
        next();
    }
};

module.exports = guestMiddleware;
