const mongoose = require('mongoose');

const validID = (ID) => {
    let objID = undefined;
    try {
        objID = new mongoose.Types.ObjectId(ID);
    } catch (err) {
        return false;
    }
    return objID.toString() === ID;
}


module.exports = {
    validID
};