FROM sproutupco/ubuntu-node

WORKDIR /home/node

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
EXPOSE 3000
