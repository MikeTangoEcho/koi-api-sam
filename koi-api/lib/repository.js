'use strict';

var Config = require('./config');
const uuidv4 = require('uuid/v4');
var AWS = require('aws-sdk');
// https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB.html

var repository = exports = module.exports = {};

var getPartitionKey = function (now, place) {
    return [now.getUTCFullYear(),
        now.getUTCMonth() + 1, // lol
        now.getUTCDate(),
        place].join('-');
}

repository.addMessage  = async function (event, context) {
    // Init DynamoDB inside of function because of aws-sdk-mock - missing aws region
    var dynamo = new AWS.DynamoDB();

    // PayLoad Checked by APIGateway
    var payload = JSON.parse(event.body);

    // TODO Cognito or Auth Lambda
    payload.userId = "Someone";
    payload.userName = "Someone";

    // Forge Key
    // - PlaceKey = YYYY-DD-MM-PLACE-SUBKEY?
    // - SortKey = CreatedAt-MessageId
    // - MessageId = UUID() random
    const now = new Date();
    const messageId = uuidv4();
    const placeKey = getPartitionKey(now, payload.place);
    const sortKey = [now.toISOString(), messageId].join('-');

    // DynamDB Item
    var item = {
        'placeKey': {S: placeKey},
        'sortKey': {S: sortKey},
        'messageId': {S: messageId},
        'createdAt': {S: now.toISOString()},
        'content': {S: payload.content},
        'place': {S: payload.place},
        'userId': {S: payload.userId},
        'userName': {S: payload.userName},
    };

    // Add TTL
    if (Config().messageTTL && Config().messageTableTTLAttribute) {
        item[Config().messageTableTTLAttribute] =
            {N: (Math.floor(now / 1000) + Config().messageTTL).toString()};
    }

    var params = {
        TableName: Config().messageTableName,
        Item: item
    };

    // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB.html#putItem-property
    await dynamo.putItem(params).promise();

    return messageId;
};

repository.getMessages = async function (event, context) {
    // Init DynamoDB inside of function because of aws-sdk-mock - missing aws region
    var dynamo = new AWS.DynamoDB.DocumentClient(); // Sweet Marshalling included
    
    var place = event.queryStringParameters.place;
    const now = new Date()
    const placeKey = getPartitionKey(now, place);

    var params = {
        TableName : Config().messageTableName,
        ExpressionAttributeValues: {
            ':placeKey': placeKey
        },
        KeyConditionExpression: 'placeKey = :placeKey',
        ScanIndexForward: false, // Desc order
        ProjectionExpression: 'messageId, createdAt, content, place, userId, userName'
        // Limit: 
        // - Nb of items read before filtering or 1mb => same name but different behaviour
        // - Pagination must be coded with several queries => problems on read consistency 
        //ExclusiveStartKey: {} // TODO Pages
    };
    
    // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB.html#query-property
    var result = await dynamo.query(params).promise();

    return result.Items;
};
