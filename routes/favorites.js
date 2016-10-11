'use strict';

const boom = require('boom');
const express = require('express');
const jwt = require('jsonwebtoken');
const knex = require('../knex');
const { camelizeKeys, decamelizeKeys } = require('humps');

// eslint-disable-next-line new-cap
const router = express.Router();

const authorize = function(req, res, next) {
  jwt.verify(req.cookies.token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return next(boom.create(401, 'Unauthorized'));
    }

    req.token = decoded;
    // You can now access the payload via req.token.userId
    next();
  });
};

router.get('/favorites', authorize, (req, res, next) => {
  const { userId } = req.token;

  knex('favorites')
    .innerJoin('books', 'books.id', 'favorites.book_id')
    .where('favorites.user_id', userId)
    .orderBy('books.title', 'ASC')
    .then((rows) => {
      const favorites = camelizeKeys(rows);

      res.send(favorites);
    })
    .catch((err) => {
      next(err);
    });
});

router.get('/favorites/check', authorize, (req, res, next) => {
  const { userId } = req.token;
  const bookId = Number.parseInt(req.query.bookId);

  if (!bookId || (isNaN(bookId))) {
    return next(boom.create(400, 'Book ID must be an integer'));
  }

  knex('favorites')
    .innerJoin('books', 'books.id', 'favorites.book_id')
    .where('favorites.book_id', bookId)
    .first()
    .then((row) => {

    if (!row) {
      return res.send(false)
    }

      res.send(true);
    })
    .catch((err) => {
      next(err);
    });
});

router.post('/favorites', authorize, (req, res, next) => {
  const { userId } = req.token;
  const bookId  = req.body.bookId;

  if (!bookId) {
    return next(boom.create(400, 'Book Id must not be blank'));
  }

  if ((isNaN(bookId))) {
    return next(boom.create(400, 'Book ID must be an integer'));
  }

  const insertFavorite = {
    bookId,
    userId
  };

  knex('books')
  .where('id', bookId)
  .first()
  .then((book) => {
    if (!book) {
        return next(boom.create(404, 'Book not found'));
    }

    return knex('favorites')
      .insert(decamelizeKeys(insertFavorite), '*')
  })
  .then((rows) => {
    const favorite = camelizeKeys(rows[0])

    res.send(favorite);
  })
  .catch((err) => {
    next(err);
  });

});

router.delete('/favorites', authorize, (req, res, next) => {
  const { userId } = req.token;
  let favorite ={};

  const bookId  = req.body.bookId;

  if (!bookId) {
    return next(boom.create(400, 'Book Id must not be blank'));
  }

  if ((isNaN(bookId))) {
    return next(boom.create(400, 'Book ID must be an integer'));
  }


  knex('favorites')
    .where('book_id', bookId)
    .andWhere('user_id', userId)
    .first()
    .then((row) => {

      if (!row) {
        throw boom.create(404, 'Favorite not found');
      }

      favorite.bookId = bookId;
      favorite.userId = userId;

      return knex('favorites')
        .del()
        .where('book_id', bookId)
        .andWhere('user_id', userId)

    })
    .then(() => {

      res.send(camelizeKeys(favorite));
    })
    .catch((err) => {
      next(err);
    });
    });


module.exports = router;
