FROM sproutupco/ubuntu-node
#FROM sproutupco/alpine-node

WORKDIR /home/node

# update
RUN apt-get update && apt-get install -y build-essential
# RUN apk update
# RUN npm install -g npm@latest
RUN npm install -g bower
RUN npm install -g gulp
RUN npm install -g jshint nodemon

# Install packages
COPY package.json package.json
RUN npm install

# Manually trigger bower. Why doesnt this work via npm install?
COPY .bowerrc .bowerrc
COPY bower.json bower.json
RUN bower install --config.interactive=false --allow-root --quiet

# Copy config folders excluding local.js
COPY config/config.js config/config.js
COPY config/assets/cloud-foundry.js config/assets/cloud-foundry.js
COPY config/assets/default.js config/assets/default.js
COPY config/assets/development.js config/assets/development.js
COPY config/assets/production.js config/assets/production.js
COPY config/assets/test.js config/assets/test.js
COPY config/env/cloud-foundry.js config/env/cloud-foundry.js
COPY config/env/default.js config/env/default.js
COPY config/env/development.js config/env/development.js
COPY config/env/production.js config/env/production.js
COPY config/env/test.js config/env/test.js
COPY config/lib config/lib

COPY modules modules
COPY public public
COPY server.js gulpfile.js ./
COPY .csslintrc .jshintrc makefile .slugignore ./

RUN gulp build lint

CMD [ "node", "server.js" ]

# Port 3000 for server
# Port 35729 for livereload
EXPOSE 3000
