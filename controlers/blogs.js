const blogRouter = require('express').Router()
const jwt = require('jsonwebtoken')
const Blog = require('../models/Blog')
const User = require('../models/User')

// const getToken = (req) => {
//   const authorization = req.get('authorization')
//   if (authorization && authorization.toLocaleLowerCase().startsWith('bearer')) {
//     return authorization.substring(7)
//   }
//   return null
// }

blogRouter.get('/', async (request, response, next) => {
  try {
    const blogs = await Blog.find({}).populate('user', {
      username: 1,
      name: 1,
      id: 1
    })
    response.json(blogs).end()
  } catch (err) { next(err) }
})

blogRouter.post('/', async (request, response, next) => {
  const {
    title,
    author,
    url,
    likes = 0
  } = request.body
  const { token } = request

  let decodedToken
  try {
    decodedToken = jwt.verify(token, process.env.SECRET)
  } catch (err) { return next(err) }
  if (!token || !decodedToken.id) return response.status(401).json({ error: 'token missing or invalid' }).end()

  const userData = await User.findById(decodedToken.id)

  const newBlog = {
    title,
    author,
    url,
    likes,
    user: userData.id
  }
  const blog = new Blog(newBlog)
  try {
    const savedBlog = await blog.save()

    userData.blogs = userData.blogs.concat(savedBlog.id)
    await User.findByIdAndUpdate(userData.id, userData)

    response.status(201).json(savedBlog).end()
  } catch (err) { next(err) }
})

blogRouter.delete('/:id', async (req, res, next) => {
  const { id } = req.params
  const { token } = req

  let decodedToken
  try {
    decodedToken = jwt.verify(token, process.env.SECRET)
  } catch (err) { return next(err) }
  if (!token || !decodedToken.id) return res.status(401).json({ error: 'token missing or invalid' }).end()

  try {
    const blogToDelete = await Blog.findById(id)

    if (!(blogToDelete.user.toString() === decodedToken.id)) return res.status(401).json({ error: 'unauthorized' }).end()
  } catch (err) { return next(err) }

  try {
    const blog = await Blog.findByIdAndDelete(id)
    if (blog === null) return res.json({ error: 'blog not found' }).status(400).end()
    return res.json(blog).status(200).end()
  } catch (err) { next(err) }
})

blogRouter.put('/:id', async (req, res, next) => {
  const { id } = req.params

  const newBlogInfo = {
    title: req.body.title,
    author: req.body.author,
    url: req.body.url,
    likes: req.body.likes
  }

  try {
    const updated = await Blog.findByIdAndUpdate(id, newBlogInfo, { new: true })
    res.json(updated).status(200).end()
  } catch (err) { next(err) }
})

module.exports = blogRouter
