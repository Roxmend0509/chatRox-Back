global.db = require('../db')
global.fs = require('fs')
global.moment = require('moment')

global.PATHS = {
	API: '/api',

}

global.KEYS = {
	BETWEEN: 'between',
	FIND: 'find',
	LIKE: 'like',
	NOTNULL: 'notnull',
	JSON: 'json',
	SORT: 'sort',
	EQUAL: 'eq',
	IN: 'in',
	NOT_EQUAL: 'ne',
	GREATER_OR_EQUAL: 'gte',
	GREATER_THAN: 'gt',
	LOWER_OR_EQUAL: 'lte',
	LOWER_THAN: 'lt',
	NULL: 'null',
	EMPTY: 'empty',
	NOT_EMPTY: 'notEmpty',
	REDIRECT: 'redirect',
	DATA_VALUES: 'dataValues'
}
global.HEADERS = {
	API_KEY: 'api_key',
}

global.REASONS = {
	Success: { code: 0, details: 'Success' },
	NotFound: { code: 1, details: 'NotFound' },
	IncompleteData: { code: 2, details: 'IncompleteData' },
	DBFailure: { code: 3, details: 'DBFailure' },
	PrivilegeMissing: { code: 4, details: 'PrivilegeMissing' },
	AlreadyExists: { code: 5, details: 'AlreadyExists' },
	BadRequest: { code: 6, details: 'BadRequest' },
	InvalidCredentials: { code: 7, details: 'InvalidCredentials' },
	Expired: { code: 8, details: 'expired' },
	UnknownError: { code: 9, details: 'UnknownError' },
	DuplicateEntry: { code: 10, details: 'DuplicateEntry' },
	NotImplemented: { code: 20, details: 'NotImplemented' },
	LambdaError: { code: 21, details: 'LambdaError' },
	PushNotification: { code: 22, details: 'PushNotification' },
	AccessDenied: { code: 50, details: 'AccessDenied' },
	ThirdParty: { code: 100, details: 'ThirdParty' }
}

global.createResponse = ({data = null, reason = REASONS.Success}) => ({ data, success: reason === REASONS.Success, reason })

global.moment = require('moment')
