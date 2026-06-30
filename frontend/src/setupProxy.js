module.exports = function (app) {
  app.use(function (req, res, next) {
    res.setHeader("Cross-Origin-Opener-Policy", "unsafe-none");
    next();
  });
};
