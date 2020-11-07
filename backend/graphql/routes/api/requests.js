//importamos fetch
const fetch = require("node-fetch");

exports.get_all_yuks = async () => {
    return fetch('http://localhost:3000/api/yuks')
    .then(response => response.json())
    .then(data => {
        return data;
    });
}

exports.get_user_by_username = async (username) => {
    return fetch(`http://localhost:3000/api/profiles/${username}`)
    .then(response => response.json())
    .then(data => {
        return data;
    });
}