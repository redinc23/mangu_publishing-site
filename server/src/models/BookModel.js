// This file defines the structure of our Book item in DynamoDB

// The name of our DynamoDB table
export const BOOKS_TABLE_NAME = 'mangu-books';

// A function to convert a book object to the format needed for DynamoDB
export const bookToItem = (book) => {
  return {
    id: { N: book.id.toString() }, // 'N' for Number
    title: { S: book.title },       // 'S' for String
    author: { S: book.author },
    genre: { S: book.genre },
    year: { N: book.year.toString() },
    rating: { N: book.rating?.toString() || '0' }, // Handle optional rating
    cover: { S: book.cover },
    description: { S: book.description }
  };
};

// A function to convert a DynamoDB item back to a regular JavaScript object
export const itemToBook = (item) => {
  return {
    id: parseInt(item.id.N),
    title: item.title.S,
    author: item.author.S,
    genre: item.genre.S,
    year: parseInt(item.year.N),
    rating: item.rating ? parseFloat(item.rating.N) : null,
    cover: item.cover.S,
    description: item.description.S
  };
};
