const mongoose = require('mongoose');

const validID = (ID) => {
    let objId = undefined;
    try {
        objId = new mongoose.Types.ObjectId(ID);
    } catch (err) {
        return false;
    }
    return objId.toString() === ID;
}


module.exports = {
    validID
};