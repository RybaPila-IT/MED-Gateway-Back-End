const createContext = (req, res, next) => {
    req.context = {};
    next();
}

module.exports = {
    createContext
};