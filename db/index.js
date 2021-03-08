const { Client } = require('pg'); // imports the pg module

// supply the db name and location of the database
const client = new Client('postgres://localhost:5432/juicebox-dev');

async function getAllUsers() {
    const { rows } = await client.query(
        `SELECT id, username, name, location 
      FROM users;
    `);

    return rows;
}
async function getAllPosts() {
    const { rows } = await client.query(
        `SELECT id, title, content, active, "authorId" 
      FROM posts;
    `);

    return rows;
}

async function createUser({
    username,
    password,
    name,
    location
}) {
    try {
        console.log('name: ', name);
        const result = await client.query(`
        INSERT INTO users(username, password, name, location)
        VALUES ($1, $2, $3, $4) ON CONFLICT (username) DO NOTHING 
        RETURNING *;
      `, [username, password, name, location]);

        return result.rows;
    } catch (error) {
        throw error;
    }
}

async function updateUser(id, fields = {}) {
    // build the set string
    const setString = Object.keys(fields).map(
        (key, index) => `"${key}"=$${index + 1}`
    ).join(', ');

    // return early if this is called without fields
    if (setString.length === 0) {
        return;
    }

    try {
        const result = await client.query(`
        UPDATE users
        SET ${setString}
        WHERE id=${id}
        RETURNING *;
      `, Object.values(fields));

        return result.rows;
    } catch (error) {
        throw error;
    }
}

async function createPost({
    authorId,
    title,
    content
}) {
    try {
        const result = await client.query(`
        INSERT INTO posts("authorId", title, content)
        VALUES ($1, $2, $3);
        `, [authorId, title, content]);
        return result.rows;
        // id SERIAL PRIMARY KEY,
        //         "authorId" INTEGER REFERENCES users(id) NOT NULL,
        //         title VARCHAR(255) NOT NULL,
        //         content TEXT NOT NULL,
    } catch (error) {
        throw error;
    }
}

async function updatePost(id, {
    title,
    content,
    active
}) {
    const setString = [`"title"=$1`, `"content"=$2`, `"active"=$3`].join(', ');

    // return early if this is called without fields
    if (setString.length === 0) {
        return;
    }

    try {
        const result = await client.query(`
          UPDATE posts
          SET "title"=$1, "content"=$2, "active"=$3
          WHERE id=${id}
          RETURNING *;
        `, [title, content, active]);

        return result.rows;
    } catch (error) {
        throw error;
    }
}

async function getPostsByUser(userId) {
    try {
        const { rows } = await client.query(`
        SELECT id, title, content, active, "authorId" FROM posts
        WHERE "authorId"=$1;
      `, [userId]);
        return rows;
    } catch (error) {
        throw error;
    }
}

async function getUserById(userId) {
    // first get the user (NOTE: Remember the query returns 
    // (1) an object that contains 
    // (2) a `rows` array that (in this case) will contain 
    // (3) one object, which is our user.
    // if it doesn't exist (if there are no `rows` or `rows.length`), return null

    let result = await client.query(`SELECT id, username, name, location FROM users WHERE id=$1;`, [userId]);
    result = result.rows[0];
    if (result.length === 0) {
        return null;
    }
    const posts = await getPostsByUser(userId);
    result.posts = [...posts];
    return result;

    // if it does:
    // delete the 'password' key from the returned object
    // get their posts (use getPostsByUser)
    // then add the posts to the user object with key 'posts'
    // return the user object
}
//

// and export them
module.exports = {
    client,
    getAllUsers,
    createUser,
    updateUser,
    getUserById,
    createPost,
    updatePost,
    getAllPosts
}