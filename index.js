const express = require('express')
const verifier = require('@gradeup/email-verify')
const bcrypt = require('bcrypt')
const app = express()
require('dotenv').config()
const port = process.env.PORT || 3000
const {v4: uuidv4} = require('uuid')

// Add Swagger UI
const swaggerUi = require('swagger-ui-express');
const yamlJs = require('yamljs');
const swaggerDocument = yamlJs.load('./swagger.yml');
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

app.use(express.static('public'))
app.use(express.json())

// Global error handler
app.use((error, req, res, next) => {
    console.error(error)
    res.status(500).send('Internal server error')
})

const users = [
    {id: 1, email: 'admin', password: '$2b$10$0EfA6fMFRDVQWzU0WR1dmelPA7.qSp7ZYJAgneGsy2ikQltX2Duey'}
]

const plants = [
    {
        id: 1,
        name: 'Võilill',
        description: 'See on võilill',
        userId: 1
    },
    {
        id: 2,
        name: 'Vereurmarohi',
        description: 'See on vereurmarohi',
        userId: 2
    },
    {
        id: 3,
        name: 'Nõges',
        description: 'See on nõges',
        userId: 1
    },
]

let sessions = [
       {id: '123', userId: 1}
]

function tryToParseJson(jsonString) {
    try {
        const o = JSON.parse(jsonString);
        if (o && typeof o === "object") {
            return o;
        }
    } catch (e) {
    }
    return false;
}

app.post('/users', async (req, res) => {

    // Validate email and password
    if (!req.body.email || !req.body.password) return res.status(400).send('Email and password are required')
    if (req.body.password.length < 8) return res.status(400).send('Password must be at least 8 characters long')
    if (!req.body.email.match(/^[+a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/)) return res.status(400).send('Email must be in a valid format')

    //Check if email already exists
    if (users.find(user => user.email === req.body.email)) return res.status(409).send('Email already exists')

    // Try to contact the mail server and send a test email without actually sending it
    try {
        const result = await verifyEmail(req.body.email);
        if (!result.success) {
            return res.status(400).send('Email is invalid: ' + result.info)
        }
        console.log('Email verified')
    } catch (error) {
        const errorObject = tryToParseJson(error)
        if (errorObject && errorObject.info) {
            return res.status(400).send('Email is invalid: ' + errorObject.info)
        }
        return res.status(400).send('Email is invalid: ' + error)
    }

    // Hash password
    let hashedPassword
    try {
        hashedPassword = await bcrypt.hash(req.body.password, 10);
    } catch (error) {
        console.error(error);
    }

    // Find max id
    const maxId = users.reduce((maxId, user) => user.id > maxId ? user.id : maxId, 0)

    // Save user to database
    console.log(hashedPassword)
    users.push({id: maxId + 1, email: req.body.email, password: hashedPassword})

    res.status(201).end()

})

// POST /sessions
app.post('/sessions', async (req, res) => {

    // Validate email and password
    if (!req.body.email || !req.body.password) return res.status(400).send('Email and password are required')

    // Find user in database
    const user = users.find(user => user.email === req.body.email)
    if (!user) return res.status(404).send('User not found')

    // Compare password
    try {
        if (await bcrypt.compare(req.body.password, user.password)) {

            // Create session
            const session = {id: uuidv4(), userId: user.id}

            // Add session to sessions array
            sessions.push(session)

            // Send session to client
            res.status(201).send(session)
        } else {
            // Passwords don't match
            res.status(401).send('Invalid password')
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error')
    }

})

function authorizeRequest(req, res, next) {
    // Check that there is an Authorization header
    if (!req.headers.authorization) return res.status(401).send('Authorization header is missing')

    // Check that the Authorization header is in the correct format
    const authorizationHeader = req.headers.authorization.split(' ')
    if (authorizationHeader.length !== 2 || authorizationHeader[0] !== 'Bearer') return res.status(401).send('Invalid Authorization header')

    // Get the session id from the Authorization header
    const sessionId = authorizationHeader[1]

    // Find the session in the sessions array
    const session = sessions.find(session => session.id === sessionId)
    if (!session) return res.status(401).send('Invalid session id')

    // Check that the user exists
    const user = users.find(user => user.id === session.userId)
    if (!user) return res.status(401).send('Invalid user id')

    // Add user to request object
    req.user = user

    // Add session to request object
    req.session = session

    // Call next middleware
    next()

}

app.get('/plants', authorizeRequest, (req, res) => {

    // get plants for user
    const plantsForUser = plants.filter(plant => plant.userId === req.user.id)

    res.send(plantsForUser)

})
app.delete('/sessions', authorizeRequest, (req, res) => {

    // Remove session from sessions array
    sessions = sessions.filter(session => session.id !== req.session.id)

    res.status(204).end()

})

app.post('/plants', authorizeRequest, (req, res) => {

        // Validate name and description
    if (!req.body.name || !req.body.description) return res.status(400).send('Name and description are required')

    // Find max id
    const maxId = plants.reduce((max, plant) => plant.id > max ? plant.id : max, plants[0].id)

    // Save plant to database
    plants.push({id: maxId + 1, name: req.body.name, description: req.body.description, userId: req.user.id})

    // Send plant to client
    res.status(201).send(plants[plants.length - 1])
})

app.delete('/plants/:id', authorizeRequest, (req, res) => {

        // Find plant in database
        const plant = plants.find(plant => plant.id === parseInt(req.params.id))
        if (!plant) return res.status(404).send('Plant not found')

        // Check that the plant belongs to the user
        if (plant.userId !== req.user.id) return res.status(403).send('Forbidden')

        // Remove plant from plants array
        plants.splice(plants.indexOf(plant), 1)

        res.status(204).end()

})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

function verifyEmail(email) {
    return new Promise((resolve, reject) => {
        verifier.verify(email, (err, info) => {
            console.log(err, info);
            if (err) {
                reject(JSON.stringify([err, info]));
            } else {
                resolve(info);
            }
        });
    });
}
