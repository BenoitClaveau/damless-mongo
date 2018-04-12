/*!
 * dambreaker-mongo
 * Copyright(c) 2016 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */
"use strict"

const { Error } = require("oups");
const Qwebs = require("qwebs");
const path = require("path");
const { inspect } = require("util");

class Setup {

    constructor() {
        this.qwebs = new Qwebs({ dirname: __dirname });
    }

    async resolve(name) {
        return await this.qwebs.resolve(name);
    }

    async run(options = {}) {
        const { mongo = true, http = true } = options;
        try {
            const { qwebs } = this;
            if (mongo) await qwebs.inject("$mongo", path.join(__dirname, "..", "index"));
            if (http) await qwebs.inject("$http", "qwebs-http");
            await qwebs.load();
            
            if (!mongo)  return
            const config = await qwebs.resolve("config");
            if (config.mongo.host !== "localhost") throw new Error("Inconherent mongo connectionString.");
            if (config.mongo.database !== "test") throw new Error("Inconherent mongo connectionString.");

            await this.clear();
            await this.schema();
            await this.data();
        }
        catch(error) {
            console.error(inspect(error));
            throw error;
        }
    };

    async schema() {
        const { qwebs } = this;
        let mongo = await qwebs.resolve("$mongo");
        let db = await mongo.connect();
        await db.createCollection("users");
        await db.ensureIndex("users", { "login": 1 });
    };
    
    async data() {
        const { qwebs } = this;
        const mongo = await qwebs.resolve("$mongo");
        const db = await mongo.connect();

        [
            { login: "paul", password: "1234", address: { city: "Paris"}},
            { login: "henri", password: "mypass", address: { city: "Versailles"}},
            { login: "pierre", password: "pass", address: { city: "Paris"}},
            { login: "jean-paul", password: "passw@rd", address: { city: "Nantes"}},
            { login: "peter", password: "pan", address: { city: "Bordeaux"}},
            { login: "parker", password: "tony", address: { city: "Puteaux"}},
        ].map(async user => {;
            await db.collection("users").insertOne(user);
        })

    };

    async clear() {
        const { qwebs } = this;
        let mongo = await qwebs.resolve("$mongo");
        let db = await mongo.connect();
        await db.collection("users").remove();
    };

    async stop() {
        const { qwebs } = this;
        await qwebs.unload();
    }

};

exports = module.exports = new Setup();
