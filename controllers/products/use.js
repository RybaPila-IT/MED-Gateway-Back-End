const fetch = require('node-fetch');
const httpStatus = require('http-status-codes');
const cloudinary = require('cloudinary').v2;
const uuid = require('uuid');
const EnvKeys = require('../../env/keys');
const Endpoints = require('../../env/endpoints');
const log = require('npmlog');
const {
    requireProductIdInParams,
    fetchProduct
} = require('./get')
const {
    fetchHistory
} = require('../history/get');
const {
    userIsVerified
} = require('../../middleware/authenticate');

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


const productStoresPhoto = {
    // Fetal-Net.
    '625576dda784a265d36ff314': true,
    // Baby-Net, which is not suppoerted yet.
    '6256a8a79bceb35be10e391e': false
}

const productIsActive = (req, res, next) => {
    const {product_doc} = req;
    if (!product_doc.is_active) {
        return res
            .status(httpStatus.BAD_REQUEST)
            .json({
                message: 'One can not use inactive product'
            });
    }
    next();
}


const ensurePredictionPropertiesArePresent = (req, res, next) => {
    const {patient_name, patient_surname, description, data, date} = req.body;
    const predictionRequestProperties = [
        {prop: patient_name, propName: 'Patient name'},
        {prop: patient_surname, propName: 'Patient surname'},
        {prop: description, propName: 'Description'},
        {prop: data, propName: 'Data'},
        {prop: date, propName: 'Date'}
    ];
    for (const item of predictionRequestProperties) {
        if (!item.prop) {
            log.log('info', 'USE PRODUCT', 'Missing', item.propName, ', forbidding to use the product');
            return res
                .status(httpStatus.BAD_REQUEST)
                .json({
                    message: `${item.propName} is not specified but is mandatory`
                });
        }
    }
    next();
}


const convertImageData = async (req, res, next) => {
    const {data} = req.body;
    const token = process.env[EnvKeys.dicomConverterAccessToken];
    const dicomConverterURL = `${Endpoints.DicomConverter}/convert`
    let converterResponse = undefined;
    try {
        converterResponse = checkResponseStatus(
            await fetch(dicomConverterURL, {
                method: 'post',
                body: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            })
        );
    } catch (err) {
        log.log('error', 'USE PRODUCT', 'Error at convertImageData:', err.message);
        return res
            .status(httpStatus.INTERNAL_SERVER_ERROR)
            .json({
                message: 'Error while converting provided DICOM image'
            });
    }
    // Set the response bytes to the actual data now.
    // Previous DICOM bytes are redundant.
    req.body.data = await converterResponse.json();
    // Continue the pipeline execution.
    next();
}


const makePrediction = async (req, res, next) => {
    const {productID} = req;
    const {data} = req.body;
    const productEndpointUrl = `${Endpoints.Products[productID]}/predict`;
    const accessToken = process.env[EnvKeys.productsAccessTokens[productID]];
    let predictionResponse = undefined;
    try {
        predictionResponse = checkResponseStatus(
            await fetch(productEndpointUrl, {
                method: 'post',
                body: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                }
            })
        );
    } catch (err) {
        log.log('error', 'USE PRODUCT', 'Error at makePrediction:', err.message);
        return res
            .status(httpStatus.INTERNAL_SERVER_ERROR)
            .json({
                message: 'Internal error while making prediction on the provided data'
            });
    }
    // Set the response bytes to the actual prediction
    // since converted image is redundant now.
    req.body.data = await predictionResponse.json();
    // Continue pipeline execution.
    next();
}


const storePredictionPhotoResultInCloudinary = async (req, res, next) => {
    const {productID} = req;
    // End execution if we do not need to store photo.
    if (!productStoresPhoto[productID]) {
        req.body.photo_url = '';
        req.body.has_photo = false;
        // Continue the execution pipeline.
        return next();
    }
    // Identifier of the asset will be random.
    const {photo} = req.body.data;
    const {_id: userID} = req.token;
    const public_id = uuid.v4();
    const file = `data:image/png;base64,${photo}`;
    const folder = `predictions/${userID}`;
    let photoResult = undefined;
    try {
        photoResult = await cloudinary.uploader.upload(file, {
            public_id,
            folder
        });
    } catch (err) {
        log.log('error', 'USE PRODUCT', 'Error at storePredictionPhotoResult:', err.message);
        return res
            .status(httpStatus.INTERNAL_SERVER_ERROR)
            .json({
                message: 'Error while saving prediction image result'
            })
    }
    const {secure_url} = photoResult;
    // Store the url in the request body for adding in the DB.
    req.body.photo_url = secure_url;
    req.body.has_photo = true;
    // Continue the execution pipeline.
    next();
}


const storePredictionResultInDatabase = async (req, res, next) => {
    const {patient_name, patient_surname, description, has_photo, photo_url, date} = req.body;
    const {prediction} = req.body.data;
    const {history} = req;
    try {
        await history.updateOne({
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
        });
    } catch (err) {
        log.log('error', 'USE PRODUCT', 'Error at storePredictionResultInDatabase:', err.message);
        return res
            .status(httpStatus.INTERNAL_SERVER_ERROR)
            .json({
                message: 'Internal error while updating product usage history'
            })
    }
    next();
}


const sendResponse = (req, res) => {
    const {_id: userID} = req.token;
    const {productID} = req;
    const {photo_url} = req.body;
    const {prediction} = req.body.data;

    res
        .status(httpStatus.OK)
        .json({
            message: 'Your prediction has been successful!',
            photo_url,
            prediction
        });
    // Final logging
    log.log(
        'info', 'USE PRODUCT', 'User', userID, 'successfully used product', productID,
        '. Result photo URL is "', photo_url, '"'
    );
}


const useProduct = [
    ...userIsVerified,
    requireProductIdInParams,
    fetchProduct,
    productIsActive,
    ensurePredictionPropertiesArePresent,
    convertImageData,
    makePrediction,
    storePredictionPhotoResultInCloudinary,
    fetchHistory,
    storePredictionResultInDatabase,
    sendResponse
];


module.exports = {
    useProduct,
    // Exporting single functions for testing purposes
    productIsActive,
    ensurePredictionPropertiesArePresent,
    convertImageData,
    makePrediction,
    storePredictionPhotoResultInCloudinary,
    storePredictionResultInDatabase,
    sendResponse
};