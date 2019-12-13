FROM node:lts-alpine
# add local user for security
RUN addgroup -S appTestGroup
RUN adduser -S -g appTestGroup appTestUser
USER appTestUser
# copy local files into container, set working directory and user
RUN mkdir -p /home/appTestUser/app
WORKDIR /home/appTestUser/app
COPY . /home/appTestUser/app
RUN npm install --quiet
EXPOSE 4000
CMD serverless offline start
