FROM mongo:latest
COPY seed.json /seed.json
CMD bash -c "sleep 2 && mongoimport --host mongodb --db taylor-rogers --collection blogPosts-LOCAL --type json --file /seed.json --jsonArray"
