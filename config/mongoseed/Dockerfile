FROM mongo:3.4
COPY seed.json /seed.json
CMD bash -c "sleep 2 && mongoimport --host mongodb --db taylor-rogers --collection blogPosts --type json --file /seed.json --jsonArray"
