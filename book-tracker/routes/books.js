const express = require('express');
const router = express.Router();
const pool = require('../database/db');
const axios = require('axios');

// Home Page - Display all books with sorting and search functionality
router.get('/', async (req, res) => {
    const { sort, search } = req.query;
    let query = 'SELECT * FROM books';

    // Add search functionality
    if (search) {
        query += ` WHERE title ILIKE '%${search}%' OR author ILIKE '%${search}%'`;
    }

    // Add sorting functionality
    if (sort === 'rating') {
        query += ' ORDER BY rating DESC';
    } else if (sort === 'title') {
        query += ' ORDER BY title ASC';
    } else if (sort === 'genre') {
        query += ' ORDER BY genre ASC';
    } else {
        query += ' ORDER BY date_read DESC';
    }

    try {
        const { rows } = await pool.query(query);
        res.render('index', { books: rows });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Render the "Add Book" form
router.get('/add-book', (req, res) => {
    res.render('review');
});

// Add a new book
router.post('/add', async (req, res) => {
    const { title, author, rating, notes, date_read, cover_url, genre } = req.body;

    // Input validation
    if (!title || !rating || !date_read || !genre) {
        return res.status(400).send('Title, rating, date read, and genre are required.');
    }
    if (rating < 1 || rating > 5) {
        return res.status(400).send('Rating must be between 1 and 5.');
    }

    try {
        await pool.query(
            'INSERT INTO books (title, author, rating, notes, date_read, cover_url, genre) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [title, author, rating, notes, date_read, cover_url, genre]
        );
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Delete a book
router.post('/delete/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM books WHERE id = $1', [id]);
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Fetch book cover from Open Library API
router.get('/search-cover', async (req, res) => {
    const { isbn } = req.query;
    if (!isbn) {
        return res.status(400).send('ISBN is required.');
    }

    try {
        const response = await axios.get(`https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`);
        res.json({ cover_url: response.request.res.responseUrl });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching cover');
    }
});

module.exports = router;