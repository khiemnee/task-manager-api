import('./db/mongoose.js')
import express from 'express'
import userRouter from './router/user.js'
import taskRouter from './router/task.js'


const app = new express()
const port = process.env



app.use(express.json())
app.use(userRouter)
app.use(taskRouter)




app.listen(port,()=>{
    console.log('server is up')
})

