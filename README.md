# Blog Posts API

This is a Serverless (Lambda) RESTful API built with Node, Docker, Mongo, and Codeship that serves the blog posts for the site [taylorrogers.com](https://taylor-rogers.com).

A step-by-step guide for how it was built and why can be found [here](https://taylor-rogers.com/dev/creating-a-serverless-api-with-mongo-docker-and-codeship).

More comprehensive documentation is forthcoming upon conversion to OPEN-API v3 Standard and completion of a new endpoint testing framework.

In the mean time, it supports the following:

- `GET` at `/blog` for an array of all posts
- `GET` at `/blog/{id}` to get a single blog post
- `POST` at `/blog` to create a new blog post
- `PATCH` at `/blog/{id}` to update a blog post
- `DELETE` at `/blog/{id}` to delete a blog post

Various options may or may not exist at each endpoint. Again, further clarification will be forthcoming with the new documentation.
