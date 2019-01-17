'use strict';

const app = require('../../app.js');
const chai = require('chai');
chai.use(require('chai-string'));
const expect = chai.expect;
var event, context;
var AWS = require('aws-sdk-mock');

describe('Tests Messages', function () {
    const env = process.env;

    beforeEach(function() {
        process.env.KOI_MESSAGE_TABLE_NAME = 'mockTable';
        process.env.KOI_MESSAGE_TABLE_TTL_ATTRIBUTE = 'ttl';
        process.env.KOI_MESSAGE_TTL = 60;
        process.env.CORS_ALLOW_ORIGIN = '*';
    });

    afterEach(function() {
        AWS.restore();
        process.env = env;
    });
    
    it('Add valid message', async () => {
        AWS.mock('DynamoDB', 'putItem', function (params, callback){
            callback(null, "successfully put item in database");
        });
        
        event = {
            resource: '/messages',
            httpMethod: 'POST',
            body: JSON.stringify({
                place: "Somewhere",
                content: "Another Message",
            })
        };
        const result = await app.lambdaHandler(event, context)

        expect(result).to.be.an('object');
        expect(result.statusCode).to.equal(201);
        expect(result.body).to.be.an('string');
        expect(result.headers).to.be.an('object');
        // TODO mock uuidv4 and match the location
        expect(result.headers.Location).to.be.an('string');
        expect(result.headers.Location).to.startsWith("/messages/");

        let response = JSON.parse(result.body);

        expect(response).to.be.an('object');
        expect(response.message).to.be.equal("Message Created");
    });
    it('Add invalid message', async () => {
        AWS.mock('DynamoDB', 'putItem', function (params, callback){
            callback(new Error());
        });
        
        event = {
            resource: '/messages',
            httpMethod: 'POST',
            body: JSON.stringify({
                place: "Somewhere",
                // TODO Body check to emulate DynamoDB TypeError on undefined 
                // Missing Content
            })
        };

        // TODO find out why expect.to.throw doesnt catch with async
        try {
            await app.lambdaHandler(event, context);
        } catch (err) {
            expect(err).to.be.an('Error');
        }
    });
    it('Get last messages', async () => {
        AWS.mock('DynamoDB.DocumentClient', 'query', function (params, callback){
            callback(null, {
                Items: [{
                    messageId: "id",
                    createdAt: "date",
                    content: "content",
                    place: "Somewhere",
                    userId: "id",
                    userName: "name"
                }],
                Count: 1,
                ScannedCount: 1,
                LastEvaluatedKey: {},
                ConsumedCapacity: {}
            });
        });
        
        event = {
            resource: '/messages',
            httpMethod: 'GET',
            queryStringParameters: {
                place: "Somewhere",
            }
        };

        const result = await app.lambdaHandler(event, context);

        expect(result).to.be.an('object');
        expect(result.statusCode).to.equal(200);
        expect(result.body).to.be.an('string');

        let response = JSON.parse(result.body);

        expect(response).to.be.an('object');
        expect(response.items).to.be.an('array');
        expect(response.items[0]).to.be.an('object');
        expect(response.items[0].place).to.be.an('string');
        expect(response.items[0].place).to.equal('Somewhere');
    });
});

