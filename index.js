const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose'); 
const bcrypt = require('bcrypt');
const UserModel = require('./models/User.js');
const PostModel = require('./models/Post.js');
const cp = require('cookie-parser');
const multer = require('multer');
const uploadMiddleware = multer({ dest: 'uploads/' })
const fs = require('fs')


const app = express()
const salt = bcrypt.genSaltSync(10)
const jwt_secret = 'somecoolsecretthatnobodycandecode'
const port = 5000
const host = 'localhost'

//
const db_uri = 'mongodb+srv://npaul:GLWbWufLLBHXoPcb@cluster0.jbeoqhz.mongodb.net/?retryWrites=true&w=majority'

// mongodb+srv://npaul:<password>@cluster0.jbeoqhz.mongodb.net/?retryWrites=true&w=majority

app.use(cors({
    credentials: true,
    origin: 'http://localhost:3000'
}))
app.use(express.json());
app.use(cp())
app.use('/uploads', express.static(__dirname+'/uploads'));

mongoose.connect(db_uri).then(()=>{
    console.log('db connection established...');
})

app.get('/', (req, res) => {
    res.send('hello')
})

app.post('/register', async (req, res) => {
    console.log('[BACKEND] ', req.body)
    const { username, email, password } = req.body
    try{
        const user = await UserModel.create({
            username,
            email, 
            password: bcrypt.hashSync(password, salt)
        })
        res.status(201).json({
            success: true,
            message:'registered in successfully',
            data: user
        })
    }catch(e){
        console.log(e);
        res.status(400).json({
            success: false,
            message: e
        })
    }
})

app.post('/login', async(req, res) => {
    console.log(req.body)
    const { username, password } = req.body
    const userdoc = await UserModel.findOne({username})
    if(!userdoc){
        res.status(400).json({
            success: false,
            message: 'User not found'
        })
    }else{
        const isValid = bcrypt.compareSync(password, userdoc.password)
        console.log(isValid, userdoc)
        if(isValid){
            jwt.sign({username,id:userdoc._id}, jwt_secret, {}, (err, token)=>{
                if(err) throw err
                else res.cookie('token', token).json({
                    success: true,
                    message:'logged in successfully',
                    data: {
                        id: userdoc._id,
                        username, token
                    }
                })
            })
        }else{
            res.status(400).json({
                success: false,
                message:'loggin failed'
            })
        }
    }
    
    
})

app.post('/post', uploadMiddleware.single('file'), async(req, res) => {
    console.log('inside /post...')
    const {originalname, path} = req.file
    let n = originalname.split('.')
    const ext = n[n.length - 1]
    const newpath = path+'.'+ext
    fs.renameSync(path, newpath)
    const { title, summary, content } = req.body  
    const { token } = req.cookies
    jwt.verify(token, jwt_secret, {}, async(err, info)=>{
        if(err) throw err;
        else{
            // res.json(info)
            const postDoc = await PostModel.create({
                title, summary, content, cover: newpath, author: info.id
            })
            res.json({
                success: true,
                data: postDoc
            })
        }
    })
    

    
})

app.get('/post', async(req,res)=>{
    const posts = await PostModel
                            .find()
                            .populate('author', ['username'])
                            .sort({createdAt: -1})
    res.json(posts)
})

app.get('/post/:id', async(req,res)=>{
    const { id } = req.params
    const postDoc = await PostModel.findById(id).populate('author', ['username'])
    res.json({
        success:true,
        data: postDoc
    })
})

app.put('/post', uploadMiddleware.single('file'), async(req, res)=>{
    let newPath = null;
    if(req.file){
        console.log('file recieved')
        const {originalname, path} = req.file
        console.log(">>",req.file)
        let n = originalname.split('.')
        const ext = n[n.length - 1]
        newPath = path+'.'+ext
        fs.renameSync(path, newPath)
    }
    console.log('>>'+newPath)
    const { token } = req.cookies;
    jwt.verify(token, jwt_secret, {}, async(err, info)=>{
        if(err) throw err;
        else{
            const { id, title, summary, content } = req.body
            const postDoc = PostModel.findById(id)
            const doc = await PostModel.findOneAndUpdate(
                { _id: id },
                {
                    title, 
                    summary, 
                    content, 
                    cover: newPath? newPath : postDoc.cover
                },
                // { new: true }
            );
            res.json(doc)

            // const postDoc = await PostModel.findById(id)
            // const isAuthor = JSON.stringify(postDoc.author) === JSON.stringify(info.id)
            // const errorString = 'you are not the author'
            // if(!isAuthor){
            //     return res.status(400).json(errorString)
            // }else{
            //     await postDoc.update({
            //         title, 
            //         summary, 
            //         content, 
            //         cover: newPath? newPath : postDoc.cover
            //     })
            //     console.log(postDoc)
            //     res.json(postDoc)
            // }
        }
    })

})

app.get('/profile', async(req, res)=>{
    const { token } = req.cookies
    if(!token) return res.json({
        username:null
    })
    jwt.verify(token, jwt_secret, {}, (err, info)=>{
        if(err) throw err;
        else{
            res.json(info)
        }
    })
    // res.json(req.cookies)
})

app.post('/logout', async(req, res)=>{
    res.cookie('token', '').json({
        success: true,
        message: 'logged out successfully'
    })
})

app.listen(port, ()=>{
    console.log(`app listening on: http://${host}:${port}`)
})
