'use strict';

var config = undefined;

module.exports = function() {
    if (typeof config === 'undefined') {
        console.log('init');
        config = {
            messageTableName: process.env.KOI_MESSAGE_TABLE_NAME,
            messageTableTTLAttribute: process.env.KOI_MESSAGE_TABLE_TTL_ATTRIBUTE,
            messageTTL: parseInt(process.env.KOI_MESSAGE_TTL),
            corsAllowOrigin: process.env.CORS_ALLOW_ORIGIN
        };
    }
    return config;
};
