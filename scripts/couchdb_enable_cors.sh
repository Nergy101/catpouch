if [ -z "$COUCHDB_USER" ]
then
      echo "Environment \$COUCHDB_USER is empty, getting from source"
      source ../.env.dev
fi

HOST="http://${COUCHDB_USER}:${COUCHDB_PASSWORD}@${COUCHDB_ADDRESS}" # or whatever you got

curl -X GET $HOST/_membership
curl -X PUT $HOST/_node/nonode@nohost/_config/httpd/enable_cors -d '"true"'
curl -X PUT $HOST/_node/nonode@nohost/_config/cors/origins -d '"*"'
curl -X PUT $HOST/_node/nonode@nohost/_config/cors/credentials -d '"true"'
curl -X PUT $HOST/_node/nonode@nohost/_config/cors/methods -d '"GET, PUT, POST, HEAD, DELETE"'
curl -X PUT $HOST/_node/nonode@nohost/_config/cors/headers -d '"accept, authorization, content-type, origin, referer, x-csrf-token"'