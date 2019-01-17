'use strict';

var Repository = require('./repository');

var router = exports = module.exports = {};


var buildResponse = function buildResponse(statusCode = 200, body = {}, headers = {}) {
    
    // Required for JS app with ApiGateway integration of type aws_proxy
    headers['Access-Control-Allow-Origin'] = process.env.CORS_ALLOW_ORIGIN;

    return {
        'statusCode': statusCode,
        'body': JSON.stringify(body),
        'headers': headers
    };
}

var raise404 = function () {
    return buildResponse(404, { 'message': 'Method Not Found' });
};

var raise405 = function () {
    return buildResponse(405, { 'message': 'Method Not Allowed' });
};

router.handle = async function (event, context) {

    if (event.resource == '/messages') {
     
        switch (event.httpMethod) {
            case 'GET':
                // TODO page ?
                var messages = await Repository.getMessages(event, context);
                return buildResponse(200, {
                    'items': messages
                });
            case 'POST':
                var messageId = await Repository.addMessage(event, context);
                return buildResponse(201,
                    { 'message': 'Message Created' },
                    {'Location': '/messages/' + messageId});
            default:
                return raise405();
        }
    }
    return raise404()
};
