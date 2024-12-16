const express = require('express')
const path = require('node:path')
const multer = require('multer')
const upload = multer({ dest: 'uploads/' })
const session = require('express-session')
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcryptjs')
const { PrismaClient } = require('@prisma/client')
const { user } = require('pg/lib/defaults')
const prisma = new PrismaClient()
const port = 3000

const app = express()

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

app.use(
  session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60000 },
  })
)
app.use(passport.session())
app.use(express.urlencoded({ extended: true }))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await prisma.users.findUnique({
        where: { username },
      })

      if (!user) {
        return done(null, false, { message: 'Incorrect username' })
      }
      const match = await bcrypt.compare(password, user.password)
      if (!match) {
        return done(null, false, { message: 'Incorrect password' })
      }
      return done(null, user)
    } catch (err) {
      return done(err)
    }
  })
)

passport.serializeUser((user, done) => done(null, user.id))
passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.users.findUnique({
      where: { id },
    })
    done(null, user)
  } catch (error) {
    done(error)
  }
})

app.use((req, res, next) => {
  res.locals.user = req.user
  next()
})

app.get('/', async (req, res) => {
  res.render('index')
})

app.get('/register', (req, res) => {
  res.render('register')
})

app.get('/home', async (req, res) => {
  const files = await prisma.files.findMany()
  res.render('home', { files: files })
})

app.get('/file/:name', async (req, res) => {
  const file = await prisma.files.findFirst({
    where: {
      name: req.params.name,
    },
  })
  if (file) {
    res.render('file', { file: file })
  } else {
    res.status(404).send('File not found')
  }
})

app.get('/folders', async (req, res) => {
  const userId = req.user.id
  const user = await prisma.users.findUnique({
    where: { id: userId },
    include: { folders: true },
  })
  res.render('folders', { folders: user.folders })
})

app.get('/folder/:id', async (req, res) => {
  const userId = req.user.id
  const folderId = parseInt(req.params.id, 10)
  const folder = await prisma.folders.findFirst({
    where: { id: folderId },
    include: { files: true },
  })
  if (folder.user_id !== userId) {
    return res
      .status(403)
      .send('Forbidden. You are not authorized to access this folder.')
  }
  res.render('folder', { folder: folder })
})

app.get('/edit/:id', async (req, res) => {
  const userId = req.user.id
  const folderId = parseInt(req.params.id, 10)
  const folder = await prisma.folders.findFirst({
    where: { id: folderId },
    include: { files: true },
  })
  if (folder.user_id !== userId) {
    return res
      .status(403)
      .send('Forbidden. You are not authorized to access this folder.')
  }
  res.render('edit', { folder: folder })
})

app.get('/logout', (req, res, next) => {
  req.logout((error) => {
    if (error) {
      return next(error)
    }
    res.redirect('/')
  })
})

app.post(
  '/',
  passport.authenticate('local', {
    successRedirect: '/home',
    failureRedirect: '/',
  })
)

app.post('/register', async (req, res) => {
  const { username, password, password2 } = req.body
  if (password !== password2) {
    return res.redirect('/register')
  }
  await prisma.users.create({
    data: {
      username,
      password: await bcrypt.hash(password, 10),
    },
  })
  res.redirect('/home')
})

app.post('/folders', async (req, res) => {
  const userId = req.user.id
  const name = req.body.name
  const folder = await prisma.folders.create({
    data: {
      name: name,
      user: {
        connect: { id: userId },
      },
    },
  })
  res.redirect('/folder/' + folder.id)
})

app.post('/folder/:id', upload.single('file'), async (req, res) => {
  const folderId = parseInt(req.params.id, 10)
  if (req.file) {
    await prisma.folders.update({
      where: {
        id: folderId,
      },
      data: {
        files: {
          create: {
            name: req.file.originalname,
            size: req.file.size,
            path: req.file.path,
            date: new Date().toLocaleString(),
          },
        },
      },
    })
    res.redirect('/folder/' + req.params.id)
    //res.render('folder', { folder: folder })
  } else {
    res.status(400).send('No folder or file found.')
  }
})

app.post('/edit/:id', async (req, res) => {
  const folderId = parseInt(req.params.id, 10)
  const name = req.body.name
  await prisma.folders.update({
    where: {
      id: folderId,
    },
    data: {
      name: name,
    },
  })
  res.redirect('/folder/' + folderId)
})

app.post('/delete/:id', async (req, res) => {
  const folderId = parseInt(req.params.id, 10)
  await prisma.folders.delete({
    where: {
      id: folderId,
    },
  })
  res.redirect('/folders')
})

app.post('/delete/file/:id', async (req, res) => {
  const fileId = parseInt(req.params.id, 10)
  const folderId = parseInt(req.body.folderId, 10)
  await prisma.folders.update({
    where: {
      id: folderId,
    },
    data: {
      files: {
        disconnect: {
          id: fileId,
        },
      },
    },
  })
  await prisma.files.delete({
    where: {
      id: fileId,
    },
  })
  res.redirect('/folder/' + folderId)
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
