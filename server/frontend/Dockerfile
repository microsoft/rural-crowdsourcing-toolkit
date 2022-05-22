FROM karya-base:latest
WORKDIR /usr/src/karya/frontend 

RUN npm i serve -g
COPY ./frontend /usr/src/karya/frontend 
COPY ./common /usr/src/karya/common 
COPY ./core /usr/src/karya/core
COPY ./utils /usr/src/karya/utils

EXPOSE 3000
