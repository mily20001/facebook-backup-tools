const fs = require("fs");
const login = require("facebook-chat-api");
const config = require("./config.json");

const wyn = {};

login({email: config.mail, password: config.password}, (err, api) => {
    if(err) return console.error(err);

    api.getFriendsList((err, data) => {
        if(err) return console.error(err);

        console.log(data.length);
        data.forEach((person) => {
            wyn[person.userID] = person.fullName;
        });
        fs.writeFileSync("id_to_name.json", JSON.stringify(wyn));
    });
});
