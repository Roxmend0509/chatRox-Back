const express = require('express')
const parser = require('body-parser')
const helmet = require('helmet')

global.app = express()

app.use(require('cors')())
app.use(require('express-fileupload')({
    limits: 1024*1024*1024
}))
app.use(helmet())
app.use(parser.urlencoded({
    extended: true
}))
app.use(parser.json({limit:'50mb', extended: true}))


app.get('/', (req, res) => res.send(`ip: ${ req.headers['x-forwarded-for'] }`))
app.use(async (req, res, next) => {

    /*
    if (req.body) {
        let keys = Object.keys(req.body);
        for (let k = 0; k < keys.length; k++)
            if (typeof req.body[keys[k]] === 'string') req.body[keys[k]] = req.body[keys[k]].trim();
    }
    if (req.originalUrl.startsWith(PATHS.PUBLIC)) {
        require('./src/apis/api').api()
        require('./src/apis/bcool/public').api()
        return next()
    }
     */
    switch (`/${req.originalUrl.split('/')[1]}`) {
        case PATHS.API:
            require('./src/apis/api').api()
            break
        default:
            return res.json(createResponse({ reason: REASONS.NotImplemented }))
    }
    return next()

})


process.on('unhandledRejection', (err) => {
    console.error('There was an uncaught Rejection', err)
    if (!(process.env.RUN_LOCAL && process.env.PORT)) {
        require('./src/aws/cloudwatch').log(process.env.CLOUDWATCH_ERROR_GROUP, [
            '============= unhandledRejection START =============',
            err,
            '============= unhandledRejection END ============='
        ]).then(() => console.log('uncaughtException sent to Cloudwatch'))
    }
})

process.on('uncaughtException', async (err, origin) => {
    console.error('There was an uncaught Exception', err)
    if (!(process.env.RUN_LOCAL && process.env.PORT)) {
        require('./src/aws/cloudwatch').log(process.env.CLOUDWATCH_ERROR_GROUP, [
            '============= uncaughtException START =============',
            '**** ORIGIN ****',
            origin,
            '**** ERROR ****',
            err,
            '============= uncaughtException END ============='
        ]).then(() => console.log('uncaughtException sent to Cloudwatch'))
    }
})

process.on('exit', async (err, origin) => {
    console.log('Removing db connection')
    try {
        db.disconnect()
        console.log('Removed db connection successful')
    } catch (e) {
        console.log(e)
    }
})

module.exports = app

if (process.env.RUN_LOCAL && process.env.PORT) {
    require('dotenv-json')({ path: "env.json" })
    console.log(process.env.NODE_ENV)
    app.listen(process.env.PORT, function (error) {
        if (error) {
            throw error
        }
        console.log('Listen port ' + process.env.PORT)
        require('./src/apis/globals')
    })
}
