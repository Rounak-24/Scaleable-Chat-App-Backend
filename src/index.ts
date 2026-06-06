import { app, corsOptions } from "./app.js"
import { createServer } from "http"
import { SocketService } from "./services/socket.js"
import { startMessageConsumer } from "./services/kafka.services.js"
import dotenv from "dotenv"
dotenv.config()

const port = process.env.PORT as string || 3000

async function init() {
    try{
        const httpServer = createServer(app)

        httpServer.on("error" as "mount",(err)=>{
            console.log(err)
            throw err
        })

        const socketService = new SocketService()
        socketService.io.attach(httpServer,{
            cors:corsOptions
        }) 

        httpServer.listen(port,()=>{
            console.log(`Server is listening on port ${port}`)
        })

        startMessageConsumer()
        socketService.initListeners()

    }catch(err){
        console.log(`Error occured while starting server, ${err}`)
        process.exit(1)
    }
}

init()
app.get('/',(req,res)=>{
    res.send(`Server is up & running`)
})