import http from 'http'
import url from 'url'
import { promises as fs } from 'fs'
import { RequestMethod, UserData, UserRequestData } from './types'
import { validateData } from './utils/validateData'
import { v4 as uuid } from 'uuid'
import 'dotenv/config'

const port = process.env.PORT || 8080
const REGEX_PATH_WITH_ID = /^api\/users\/.*$/gi
const REGEX_FOR_UUID = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi

const startServer = async () => {
    const data = await fs.readFile("./src/users.json", "utf8")
    const userData = JSON.parse(data) as UserData[]

    const server = http.createServer((req, res) => {

        const pathname = url.parse(req.url || '', true).pathname || ''

        if (pathname === '/api/users') {
            if (req.method === RequestMethod.GET) {
                res.writeHead(200, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify(userData, null, 2))
            } else if (req.method === RequestMethod.POST) {
                req.on('data', data => {
                    const parsedData = JSON.parse(data)
                    const isDataValid = validateData(parsedData)
                    if (isDataValid) {
                        userData.push({ id: uuid(), ...parsedData as UserRequestData })

                        fs.writeFile('./src/users.json', JSON.stringify(userData, null, 2)).then((data) => {
                            res.writeHead(201, { 'Content-Type': 'application/json' })
                            res.end(JSON.stringify(data, null, 2))
                        }).catch((error) => {
                            const message = { message: 'could not persist data!', error }
                            res.writeHead(500, { 'Content-Type': 'application/json' })
                            res.end(JSON.stringify(message, null, 2))
                        })
                    } else {
                        const message = { message: 'invalid data has been sent to server.' }
                        res.writeHead(400, { 'Content-Type': 'application/json' })
                        res.end(JSON.stringify(message, null, 2))
                    }
                })
            }
            return
        }
        else if (REGEX_PATH_WITH_ID.test(pathname)) {
            const userId = pathname.replace('api/users/', '')
            if (!REGEX_FOR_UUID.test(pathname)) {
                const message = { message: `invalid id ${userId} has been provided.` }
                res.writeHead(400, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify(message, null, 2))
                return
            }

            const userById = userData.find(({ id }) => id === userId)

            if (!userById) {
                const message = { message: `no user registered with id ${userId}` }
                res.writeHead(404, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify(message, null, 2))
                return
            }

            if (req.method === RequestMethod.GET) {
                res.writeHead(200, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify(userById, null, 2))
            } else if (req.method === RequestMethod.PUT) {
                req.on('data', data => {
                    const parsedData = JSON.parse(data)
                    const isDataValid = validateData(parsedData)
                    let updatedUser: UserData | undefined
                    if (isDataValid) {
                        userData.map((user) => {
                            if (user.id === userId) {
                                updatedUser = { ...user, ...parsedData as UserRequestData }
                                return updatedUser
                            }
                            return user
                        })

                        fs.writeFile('./src/users.json', JSON.stringify(userData, null, 2)).then(() => {
                            res.writeHead(200, { 'Content-Type': 'application/json' })
                            res.end(JSON.stringify(updatedUser, null, 2))
                        }).catch((error) => {
                            const message = { message: 'could not persist data!', error }
                            res.writeHead(500, { 'Content-Type': 'application/json' })
                            res.end(JSON.stringify(message, null, 2))
                        })
                    } else {
                        const message = { message: 'invalid data has been sent to server.' }
                        res.writeHead(400, { 'Content-Type': 'application/json' })
                        res.end(JSON.stringify(message, null, 2))
                    }
                })
            } else if (req.method === RequestMethod.DELETE) {
                const updatedData = userData.filter(({ id }) => id !== userId)
                fs.writeFile('./src/users.json', JSON.stringify(updatedData, null, 2)).then(() => {
                    res.writeHead(204, { 'Content-Type': 'application/json' })
                    res.end(`user with id ${userId} was deleted.`)
                }).catch((error) => {
                    const message = { message: 'could not delete user!', error }
                    res.writeHead(500, { 'Content-Type': 'application/json' })
                    res.end(JSON.stringify(message, null, 2))
                })
            }
            return
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' })
            res.end('this route has no data.\ntry /api/users\ntry /api/users${userId}')
        }
    })

    server.listen(port, () => {
        console.log('Server is listening on port ' + port)
    })

}

startServer()
