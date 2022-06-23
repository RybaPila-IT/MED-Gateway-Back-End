class DuplicateKeyError extends Error {
    constructor(message) {
        super(message);
    }
}

module.exports = {
    DuplicateKeyError
}