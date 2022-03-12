let models

const db = require('serverless-mysql')({
    config: {
        host: process.env.DATABASE_HOST,
        database: process.env.DB_SCHEMA,
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        timezone: process.env.TZ
    }
})

const TABLES = {
    users_test_roxana: "users_test_roxana",
}

const DATA_TYPES = {
    BOOL: (v, toTinyInt = false) => toTinyInt ? v ? '1' : '0' :  v != null ? v === '1' || v === 1 : null,
    NUMBER: (v) => v != null ? Number(v) : null,
    STRING: (v) => v != null ? String(v) : null,
    DATE: (v) => v != null ? new Date(v) : null,
    JSON: (v, stringify = false) => v != null ? stringify ? JSON.stringify(v) : JSON.parse(v) : null,
}


const DB_OPS = {
    EQUAL: '=',
    NOT_EQUAL: '<>',
    IN: 'IN',
    NOT_IN: 'NOT IN',
    BETWEEN: 'BETWEEN',
    GREATER_THAN: '>',
    GREATER_OR_EQUAL: '>=',
    LOWER_THAN: '<',
    LOWER_OR_EQUAL: '<=',
    LIKE: 'LIKE',
    IS_NULL: 'IS NULL',
    IS_NOT_NULL: 'IS NOT NULL',
    OR: 'OR',
    AND: 'AND',
    WHERE: 'WHERE',
    LIMIT: 'LIMIT',
    OFFSET: 'OFFSET',
    GROUP_BY: 'GROUP BY',
    ORDER_BY: 'ORDER BY',
    SORT: 'SORT',
    ASC: 'ASC',
    DESC: 'DESC'
}

const runQuery = async (query, params = []) => {
    try {
        let result = await db.query(query, params)
        if (Array.isArray(result))
            return result
        if (typeof result === 'object')
            result['success'] = true
        return result
    } catch (e) {
        console.log(e)
    }
    return null
}
const whereQuery = (args, params = [], recursive = false) => {
    let where = []
    for (let c in args) {
        if (c === DB_OPS.OR) {
            let orArray = []
            for (let _c of args[c])
                orArray.push(whereQuery(_c, params, true))
            where.push(orArray.join(` ${DB_OPS.OR} `))
        } else if (typeof args[c] === 'object') {
            for (let op in args[c]) {
                where.push(`\`${c}\` ${DB_OPS[op]} ?`)
                params.push(typeof args[c][op] === 'boolean' ? args[c][op] ? 1 : 0 : args[c][op])
            }
        }
        else {
            where.push(`\`${c}\` = ?`)
            params.push(typeof args[c] === 'boolean' ? args[c] ? 1 : 0 : args[c])
        }
    }
    return where.length === 0 ? '' : `${!recursive ? DB_OPS.WHERE : ''} ${where.join(` ${DB_OPS.AND} `)}`
}
const orderByQuery = (args) => {
    if (!args)
        return ''
    let order = []
    for (let a of args)
        order.push(`\`${a[0]}\` ${DB_OPS[a[1]]}`)
    return `${DB_OPS.ORDER_BY} ${order.join(',')}`
}
const groupByQuery = (args) => {
    if (!args)
        return ''
    for (let a of args) {
        a = `\`${a}\``
    }
    return `${DB_OPS.GROUP_BY} ${args.join(',')}`
}
const limitQuery = (limit) => limit ? `${DB_OPS.LIMIT} ${limit}` : '';
const offsetQuery = (offset) => offset ? `${DB_OPS.OFFSET} ${offset}` : '';
const attributesQuery = (attributes) => attributes ? attributes.toString() : '*'

const select = async ({ model, where, group, order, limit, offset, attributes }) => {
    let params = []
    const query = `SELECT ${attributesQuery(attributes)} FROM ${model} ${whereQuery(where, params)} ${groupByQuery(group)} ${orderByQuery(order)} ${limitQuery(limit)} ${offsetQuery(offset)} ${offsetQuery(offset)}`
    console.log(query, params)
    return parseModels(model, await runQuery(query, params))
}
const findOne = async ({ model, where, group, order }) => {
    let rows = await select({ model, where, group, order, limit: 1 })
    if (rows)
        return rows[0]
    return null
}
const findByPrimaryKeyQuery = ({ primaryKey, value }) => {
    let where = {}
    if (Array.isArray(primaryKey))
        for (let _pk of primaryKey)
            where[_pk] = value[_pk]
    else
        where[primaryKey] = typeof value === 'object' ? value[primaryKey] : value
    return where
}
const findByPk = async ({ model, value }) => {
    let primaryKey = getPrimaryKey(model)
    if (!primaryKey)
        return null
    return await findOne( { model, where: findByPrimaryKeyQuery({ primaryKey, value }) })
}
const insertIfNew = async ({ model, data }) => {
    const row = await findOne({ model, where: data })
    if (row)
        return { success: false, reason: REASONS.AlreadyExists }
    return await insert({ model, data })
}
const insert = async ({ model, data }) => {
    let querySet = {}
    let keys = []
    data = await encodeModels(model, data)
    if (Array.isArray(data)) {
        for (let e of data)
            keys = keys.concat(Object.keys(e))
        keys = Array.from(new Set(keys))
    } else
        keys = Object.keys(data)
    // let values = []
    if (Array.isArray(data)) {
        let _values = []
        for (let e of data) {
            for (let key of keys) {
                querySet[key] = e[key]
                // _values.push('?')
            }
        }
        // values.push(_values)
    } else {
        for (let key of keys) {
            querySet[key] = data[key]
            // values.push('?')
        }
    }
    const query = `INSERT INTO ${model} SET ?`
    console.log(query, querySet)
    return await runQuery(query, querySet)
}

const insertAndGet = async ({ model, data }) => {
    await insert({ model, data })
    return await findOne({ model, where: data })
}

const getModel = (table) => {
    if (!models) {
        try {
            models = JSON.parse(require('fs').readFileSync('models/models.json', 'utf-8'))
        } catch (e) {
            console.log(e)
        }
    }
    return models[table] || null
}
const parseModels = async (table, rows) => {
    if (!rows)
        return null
    if (!table)
        return rows
    const model = getModel(table)
    if (!model)
        return rows
    for (let row of rows) {
        let keys = Object.keys(row)
        for (let k of keys) {
            if (model[k])
                row[k] = DATA_TYPES[model[k].type](row[k])
        }
    }
    return rows
}
const encodeModels = async (table, rows) => {
    if (!table)
        return rows
    const model = getModel(table)
    if (!model)
        return rows
    if (Array.isArray(rows)) {
        for (let row of rows) {
            let keys = Object.keys(row)
            for (let k of keys) {
                if (model[k])
                    row[k] = DATA_TYPES[model[k].type](row[k], true)
            }
        }
    } else {
        let keys = Object.keys(rows)
        for (let k of keys) {
            if (model[k]) {
                rows[k] = DATA_TYPES[model[k].type](rows[k], true)
            }
        }
    }
    return rows
}
const getPrimaryKey = (table) => {
    let model = getModel(table)
    if (!model)
        return null
    let array = []
    for (let f in model)
        if (model[f].primaryKey)
            array.push(f)
    if (array.length > 1)
        return array
    if (array.length === 1)
        return array[0]
    return null
}

module.exports = {
    t: TABLES,
    op: DB_OPS,
    findOne,
    findByPk,
    findByPrimaryKeyQuery,
    findAll: select,
    insert,
    insertIfNew,
    insertAndGet,
    query: runQuery,
    getPrimaryKey,
    disconnect: () => db.quit()
}