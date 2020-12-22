FROM alpine
LABEL maintainer="1151807762@qq.com"
RUN set -eux && sed -i 's/dl-cdn.alpinelinux.org/mirrors.ustc.edu.cn/g' /etc/apk/repositories \
&& apk add --update nodejs nodejs-npm  
COPY . /src
WORKDIR /src
RUN npm install
EXPOSE 5000
ENTRYPOINT ["node","./chess.js"]

