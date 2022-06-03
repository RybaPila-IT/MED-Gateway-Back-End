// Convert image from DICOM into PNG.
// Forward request to product.
// Save received image into cloudinary.
// Make entry in history.
// Generate response to the client.
const fetch = require('node-fetch')
const httpStatus = require('http-status-codes')
const chalk = require('chalk')

const {
    dicomConverterAccessToken,
    fetalNetAccessToken,
    babyNetAccessToken
} = require('../../suppliers/constants')
const useProductMiddlewarePipeline = require('../../middleware/products/use')


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


// TODO (radek.r) Add distinction between production and development.
// TODO (radek.r) Move this to separate file with constants.
const productIdToEndpointUrl = {
    // Fetal-Net.
    '625576dda784a265d36ff314': 'http://localhost:7000/predict',
    // Baby-Net, which is not supported yet.
    '6256a8a79bceb35be10e391e': 'http://localhost:1000/'
}


const productIdToAccessToken = {
    // Fetal-Net.
    '625576dda784a265d36ff314': process.env[fetalNetAccessToken],
    // Baby-Net, which is not suppoerted yet.
    '6256a8a79bceb35be10e391e': process.env[babyNetAccessToken]
}


const convertImageData = async (req, res, next) => {
    const {data} = req.body;
    const token = process.env[dicomConverterAccessToken]
    try {
        const convertResp = checkResponseStatus(
            await fetch('http://localhost:8000/convert', {
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
                'message': `DICOM-Converter: ${err.message}`
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
                'message': `Product ${productId}: ${err.message}`
            });
    }
}


const storePredictionPhotoResult = (req, res, next) => {
    // TODO (radek.r) Implement this functionality.
    next();
}


const storePredictionResultInDatabase = (req, res, next) => {
    // TODO (radek.r) Implement this functionality.
    next();
}


const sendResponse = (req, res) => {
    res
        .status(httpStatus.OK)
        .json({
            'message': 'Your prediction has been successful!',
            'data': req.body.data
        });
}


const useProduct = [
    ...useProductMiddlewarePipeline,
    convertImageData,
    makePrediction,
    storePredictionPhotoResult,
    storePredictionResultInDatabase,
    sendResponse
];


module.exports = {
    useProduct
};