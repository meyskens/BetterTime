FROM --platform=$BUILDPLATFORM node:16 as frontend

COPY ./frontend /go/src/github.com/meyskens/BetterTime/frontend

WORKDIR /go/src/github.com/meyskens/BetterTime/frontend

ARG REACT_APP_API_URL="https://rooster.itf.to"

RUN npm install
RUN REACT_APP_API_URL=${REACT_APP_API_URL} npm run build

FROM golang:1.18-alpine as backend

COPY ./ /go/src/github.com/meyskens/BetterTime
WORKDIR /go/src/github.com/meyskens/BetterTime

RUN go build ./cmd/bettertime

FROM alpine:3.16

RUN mkdir /app
WORKDIR /app

RUN apk add --no-cache ca-certificates tzdata

COPY --from=frontend /go/src/github.com/meyskens/BetterTime/frontend/build /app/static
COPY --from=backend /go/src/github.com/meyskens/BetterTime/bettertime /usr/local/bin/bettertime

ENTRYPOINT [ "/usr/local/bin/bettertime" ]
CMD [ "serve" ]