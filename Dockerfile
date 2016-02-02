#FROM sproutupco/ubuntu-node
FROM sproutupco/alpine-node

WORKDIR /home/node

# update
# RUN apt-get update && apt-get install -y build-essential
RUN apk update
RUN npm install -g npm@latest
RUN npm install -g bower
RUN npm install -g gulp
RUN npm install -g jshint node-gyp nodemon node-inspector

# Install packages
COPY package.json package.json
RUN npm install

# Manually trigger bower. Why doesnt this work via npm install?
COPY .bowerrc .bowerrc
COPY bower.json bower.json
RUN bower install --config.interactive=false --allow-root --quiet

COPY config config
COPY modules modules
COPY public public
COPY server.js gulpfile.js ./
COPY .csslintrc .jshintrc makefile .slugignore ./

RUN gulp build lint

CMD [ "node", "server.js" ]

# Port 3000 for server
# Port 35729 for livereload
EXPOSE 3000
