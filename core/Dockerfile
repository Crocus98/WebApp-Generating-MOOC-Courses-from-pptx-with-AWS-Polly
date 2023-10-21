FROM python:3.8-alpine

WORKDIR /polly-core

RUN apk --no-cache add libreoffice
RUN apk add poppler-utils
RUN apk add ffmpeg

RUN wget https://github.com/google/fonts/archive/main.tar.gz -O gf.tar.gz && \
    tar -xf gf.tar.gz && \
    mkdir -p /usr/share/fonts/truetype/google-fonts && \
    find $PWD/fonts-main/ -name "*.ttf" -exec install -m644 {} /usr/share/fonts/truetype/google-fonts/ \; || return 1 && \
    rm -f gf.tar.gz && \
    # Remove the extracted fonts directory
    rm -rf $PWD/fonts-main && \
    # Remove the following line if you're installing more applications after this RUN command and you have errors while installing them
    rm -rf /var/cache/* && \
    fc-cache -f

VOLUME ["/tmp"]

COPY requirements.txt requirements.txt
RUN pip3 install -r requirements.txt

COPY . .

CMD [ "python", "server.py", "--host=0.0.0.0"]