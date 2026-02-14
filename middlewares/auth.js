const User = require("../models/userSchema")

//userAuth............
const userAuth = (req, res, next) => {
    if (req.session.user) {

        User.findById(req.session.user._id)
            .then(data => {
                if (data && !data.isBlocked) {
                    next();
                } else {
                    req.session.user = null
                    res.redirect("/login")
                }
            })
            .catch(error => {
                res.status(500).send("internal server error")
            })
    } else {
        res.redirect("/login")
    }
}


//adminAuth...........
const adminAuth = (req, res, next) => {
    User.findOne({ isAdmin: true })
        .then(data => {
            if (data && req.session.admin) {
                next()
            } else {
                res.redirect("/admin/login")
            }
        })
        .catch(error => {
            res.status(500).send("internal Server Error")

        })
}

//...................


module.exports = {
    userAuth,
    adminAuth,
    checkBlockedStatus: async (req, res, next) => {
        if (req.session.user) {
            try {
                // If user is logged in, check if blocked in DB
                // Need to use id since session data might be stale
                const userId = req.session.user._id || req.session.user;
                const userData = await User.findById(userId);

                if (userData && userData.isBlocked) {
                    // User is blocked - destroy session
                    req.session.user = null;
                    return req.session.destroy((err) => {
                        if (err) console.error("Session destroy error", err);
                        // Redirect to login or home, passing a flag for frontend to show alert
                        res.redirect("/login?message=Account Blocked");
                    });
                }
            } catch (error) {
                console.error("Error in checkBlockedStatus middleware", error);
            }
        }
        next();
    }


}