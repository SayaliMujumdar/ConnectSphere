const passport = require('passport');
const User = require('../models/User');

// Only register Google strategy when credentials are configured
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  const GoogleStrategy = require('passport-google-oauth20').Strategy;
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({ googleId: profile.id });
          if (!user) {
            user = await User.findOne({ email: profile.emails[0].value });
            if (user) {
              user.googleId = profile.id;
              await user.save();
            } else {
              user = await User.create({
                googleId: profile.id,
                username: profile.displayName.replace(/\s+/g, '').toLowerCase() + Date.now(),
                email: profile.emails[0].value,
                profilePicture: profile.photos[0]?.value || '',
                isVerified: true,
              });
            }
          }
          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
}

// Only register Facebook strategy when credentials are configured
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  const FacebookStrategy = require('passport-facebook').Strategy;
  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: process.env.FACEBOOK_CALLBACK_URL,
        profileFields: ['id', 'displayName', 'photos', 'email'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({ facebookId: profile.id });
          if (!user) {
            const email = profile.emails?.[0]?.value;
            if (email) {
              user = await User.findOne({ email });
            }
            if (user) {
              user.facebookId = profile.id;
              await user.save();
            } else {
              user = await User.create({
                facebookId: profile.id,
                username: profile.displayName.replace(/\s+/g, '').toLowerCase() + Date.now(),
                email: email || `fb_${profile.id}@placeholder.com`,
                profilePicture: profile.photos?.[0]?.value || '',
                isVerified: true,
              });
            }
          }
          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
}

module.exports = passport;
