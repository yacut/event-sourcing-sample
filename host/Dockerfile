FROM node
RUN apt-get update && apt-get install -y netcat
WORKDIR /src
COPY . /src
RUN npm install
ADD https://raw.githubusercontent.com/ufoscout/docker-compose-wait/1.0.0/wait.sh /src/wait.sh
RUN chmod +x /src/wait.sh
CMD ["/src/wait.sh", "&&", "npm", "start"]
