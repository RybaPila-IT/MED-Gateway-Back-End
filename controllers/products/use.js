const fetch = require('node-fetch');
const httpStatus = require('http-status-codes');
const cloudinary = require('cloudinary').v2;
const uuid = require('uuid');
const History = require('../../data/models/history');
const {useProductMiddlewarePipeline} = require('../../middleware/products/use');
const {
    dicomConverterAccessToken,
    fetalNetAccessToken,
    babyNetAccessToken
} = require('../../suppliers/constants');


class FetchResponseError extends Error {
    constructor(resp) {
        super(`Response Error: ${resp.status} ${resp.statusText}`);
    }
}


const checkResponseStatus = (res) => {
    if (res.ok) {
        return res;
    }
    // Other response status codes indicate an error.
    throw new FetchResponseError(res);
}

// TODO (rade.r) Fix this
const local = process.env['env'] === 'dev';

const dicomConverterEndpointUrl = local ? 'http://localhost:8000/convert' : ' https://med-dicom-converter.herokuapp.com/convert';

// TODO (radek.r) Add distinction between production and development.
// TODO (radek.r) Move this to separate file with constants.
const productIdToEndpointUrl = {
    // Fetal-Net.
    '625576dda784a265d36ff314': local ? 'http://localhost:7000/predict' : 'https://fetal-net-service-hsyhifhtpq-lm.a.run.app/predict',
    // Baby-Net, which is not supported yet.
    '6256a8a79bceb35be10e391e': local ?'http://localhost:1000/predict' : 'unspecified'
}


const productIdToAccessToken = {
    // Fetal-Net.
    '625576dda784a265d36ff314': process.env[fetalNetAccessToken],
    // Baby-Net, which is not suppoerted yet.
    '6256a8a79bceb35be10e391e': process.env[babyNetAccessToken]
}


const productIdStoresPhoto = {
    // Fetal-Net.
    '625576dda784a265d36ff314': true,
    // Baby-Net, which is not suppoerted yet.
    '6256a8a79bceb35be10e391e': false
}


const convertImageData = async (req, res, next) => {
    const {data} = req.body;
    const token = process.env[dicomConverterAccessToken]
    try {
        const convertResp = checkResponseStatus(
            await fetch(dicomConverterEndpointUrl, {
                method: 'post',
                body: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            })
        );
        // Set the response bytes to the actual data now.
        // Previous DICOM bytes are redundant.
        req.body.data = await convertResp.json();
        // Continue the pipeline execution.
        next();
    } catch (err) {
        res
            .status(httpStatus.INTERNAL_SERVER_ERROR)
            .json({
                message: `DICOM-Converter: ${err.message}`
            });
    }
}


const makePrediction = async (req, res, next) => {
    const {productId} = req.params;
    const {data} = req.body;
    const productEndpointUrl = productIdToEndpointUrl[productId];
    const token = productIdToAccessToken[productId];
    try {
        const predictionResp = checkResponseStatus(
            await fetch(productEndpointUrl, {
                method: 'post',
                body: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            })
        );
        // Set the response bytes to the actual data now.
        // Previous DICOM bytes are redundant.
        req.body.data = await predictionResp.json();
        // Continue pipeline execution.
        next();
    } catch (err) {
        res
            .status(httpStatus.INTERNAL_SERVER_ERROR)
            .json({
                message: `Making prediction for product ${productId}: ${err.message}`
            });
    }
}


const storePredictionPhotoResult = (req, res, next) => {
    const {productId} = req.params;
    // End execution if we do not need to store photo.
    if (!productIdStoresPhoto[productId]) {
        req.body.photo_url = '';
        req.body.has_photo = false;
        // Continue the execution pipeline.
        return next();
    }
    // Identifier of the asset will be random.
    const {photo} = req.body.data;
    const {_id: userId} = req.token;
    const public_id = uuid.v4();
    const file = `data:image/png;base64,${photo}`;
    const folder = `predictions/${userId}`;

    cloudinary.uploader
        .upload(file, {
            public_id,
            folder
        })
        .then(result => {
            const {secure_url} = result;
            // Store the url in the request body for adding in the DB.
            req.body.photo_url = secure_url;
            req.body.has_photo = true;
            // Continue the execution pipeline.
            next();
        })
        .catch(err => {
            res
                .status(httpStatus.INTERNAL_SERVER_ERROR)
                .json({
                    message: `Save prediction image error: ${err.error.errno}, ${err.error.code}`
                })
        })
}


const fetchUserHistory = (req, res, next) => {
    const {productId} = req.params;
    const {_id: userId} = req.token;

    History
        .findOne({product_id: productId, user_id: userId})
        .then(doc => {
            if (doc) {
                // If the history already exists just set it into request.
                req.body.history = doc;
                // Continue the pipeline.
                return next();
            }
            History
                .create({
                    product_id: productId,
                    user_id: userId,
                })
                .then(doc => {
                    // Set the history object in the request.
                    req.body.history = doc;
                    // Continue the pipeline.
                    next();
                })
                .catch(err => {
                    res
                        .status(httpStatus.INTERNAL_SERVER_ERROR)
                        .json({
                            message: `Create history for product ${productId}: ${err.message}`
                        });
                })
        })
        .catch(err => {
            res
                .status(httpStatus.INTERNAL_SERVER_ERROR)
                .json({
                    message: `Find history for product ${productId}: ${err.message}`
                });
        });
}


const storePredictionResultInDatabase = (req, res, next) => {
    const {
        history,
        patient_name,
        patient_surname,
        description,
        has_photo,
        photo_url,
        date
    } = req.body;
    const {
        prediction
    } = req.body.data;

    history
        .updateOne({
                $push: {
                    entries: {
                        patient_name,
                        patient_surname,
                        description,
                        date,
                        prediction,
                        has_photo,
                        photo_url
                    }
                }
            }
        )
        .then(() => {
            // Everything went great, continue the execution.
            next();
        })
        .catch(err => {
            res
                .status(httpStatus.INTERNAL_SERVER_ERROR)
                .json({
                    message: `Update history document: ${err.message}`
                })
        });
}


const sendResponse = (req, res) => {
    const {photo_url} = req.body;
    const {prediction, photo} = req.body.data;

    res
        .status(httpStatus.OK)
        .json({
            message: 'Your prediction has been successful!',
            photo_url,
            prediction,
            photo
        });
}


const useProduct = [
    ...useProductMiddlewarePipeline,
    convertImageData,
    makePrediction,
    storePredictionPhotoResult,
    fetchUserHistory,
    storePredictionResultInDatabase,
    sendResponse
];


module.exports = {
    useProduct
};