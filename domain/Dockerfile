FROM node
RUN apt-get update && apt-get install -y netcat
WORKDIR /src
COPY . /src
RUN npm install && chmod +x /src/wait-and-start.sh
CMD ["./wait-and-start.sh"]
