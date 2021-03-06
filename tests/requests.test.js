const mongoose = require('mongoose')
const supertest = require('supertest')
const { app, server } = require('../index')
const Blog = require('../models/Blog')
const User = require('../models/User')
const { initialBlogs, initialUsers } = require('./helper')

const api = supertest(app)

beforeEach(async () => {
  await User.deleteMany({})
  await User.insertMany(initialUsers)
  await Blog.deleteMany({})
  await Blog.insertMany(initialBlogs)
}, 25000)

describe('testing Get request on /api/blogs', () => {
  test('returns the correct info type', async () => {
    await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/)
  })

  test('returns the correct ammount of blogs', async () => {
    const res = await api.get('/api/blogs')
    console.log(res)
    expect(res.body).toHaveLength(initialBlogs.length)
  })

  test('returned element have correct id', async () => {
    const res = await api.get('/api/blogs')
    res.body.map(elem => expect(elem.id).toBeDefined)
  })
})

describe('Testing Post request on /api/blogs', () => {
  test('Post request adds a blog', async () => {
    const newPost = {
      title: 'Testing some Posts',
      author: 'Ezequiel',
      url: 'https://testing.test.com/',
      likes: 3,
      user: '5cfde22ade5f227463ff6a4d'
    }
    await api.post('/api/blogs', newPost).send(newPost)
    const res = await api.get('/api/blogs')
    expect(res.body).toHaveLength(initialBlogs.length + 1)
  })

  test.skip('Post request missing likes properties will default to 0', async () => {
    const newPost = {
      title: 'Testing some Posts',
      author: 'Ezequiel',
      url: 'https://testing.test.com/',
      user: '5cfde192de5f227463ff6a4b'
    }
    const res = await api.post('/api/blogs').send(newPost)
    expect(res.body).toBe(0)
  })

  test('Post request missing title properties should return bad request', async () => {
    const newPost = {
      author: 'Ezequiel',
      url: 'https://testing.test.com/',
      likes: 0,
      user: '5cfde22ade5f227463ff6a4d'
    }
    await api.post('/api/blogs')
      .send(newPost)
      .expect(400)
  })
})

describe('Testing Delete request on /api/blogs', () => {
  test('Deleting a blog reduces the ammount of blogs', async () => {
    const { body } = await api.get('/api/blogs')
    await api.delete(`/api/blogs/${body[0].id}`)
    const listAfter = await api.get('/api/blogs')
    expect(listAfter.body).toHaveLength(initialBlogs.length - 1)
  })
})

describe('Testing blog Update by PUT method', () => {
  test('updating a post changes its information', async () => {
    const newBlog = {
      title: 'Testing PUT',
      author: 'Ezequiel',
      url: 'https://testing.test.com/',
      likes: 3
    }
    const { body } = await api.get('/api/blogs')
    await api.put(`/api/blogs/${body[0].id}`)
      .send(newBlog)
    const updated = await Blog.find({ title: 'Testing PUT' })
    expect(updated).not.toBe([])
  })
})

afterAll(() => {
  mongoose.connection.close()
  server.close()
})
