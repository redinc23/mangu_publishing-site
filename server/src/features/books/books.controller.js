import dynamoDBLib from "@aws-sdk/lib-dynamodb";
const { ScanCommand, GetItemCommand, QueryCommand } = dynamoDBLib;
import { dynamoDBDocClient } from "../../config/dynamoDB.js";
import { BOOKS_TABLE_NAME, itemToBook } from "../../models/BookModel.js";

// Helper function to scan all items from DynamoDB table
const scanAllBooks = async () => {
  const command = new ScanCommand({
    TableName: BOOKS_TABLE_NAME,
  });
  
  const response = await dynamoDBDocClient.send(command);
  return response.Items.map(itemToBook);
};

export async function getFeaturedBook(req, res) {
  try {
    const allBooks = await scanAllBooks();
    // For now, return the first book as featured
    // You might want to add a 'isFeatured' attribute to your data model later
    const featured = allBooks[0] || null;
    res.json(featured);
  } catch (error) {
    console.error('Error fetching featured book:', error);
    res.status(500).json({ error: 'Failed to fetch featured book' });
  }
}

export async function getTrendingBooks(req, res) {
  try {
    const allBooks = await scanAllBooks();
    // Filter books with rating and sort by rating (descending)
    const trending = allBooks
      .filter(book => book.rating != null)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 10);
    res.json(trending);
  } catch (error) {
    console.error('Error fetching trending books:', error);
    res.status(500).json({ error: 'Failed to fetch trending books' });
  }
}

export async function getNewReleases(req, res) {
  try {
    const allBooks = await scanAllBooks();
    // For now, return all books as new releases
    // You might want to add a 'releaseDate' attribute later
    res.json(allBooks.slice(0, 12));
  } catch (error) {
    console.error('Error fetching new releases:', error);
    res.status(500).json({ error: 'Failed to fetch new releases' });
  }
}

export async function getTopRatedBooks(req, res) {
  try {
    const allBooks = await scanAllBooks();
    const topRated = allBooks
      .filter(book => book.rating != null)
      .sort((a, b) => b.rating - a.rating);
    res.json(topRated);
  } catch (error) {
    console.error('Error fetching top rated books:', error);
    res.status(500).json({ error: 'Failed to fetch top rated books' });
  }
}

export async function getAllGenres(req, res) {
  try {
    const allBooks = await scanAllBooks();
    const genresSet = new Set();
    
    for (const book of allBooks) {
      if (book.genre) {
        genresSet.add(book.genre);
      }
    }
    
    const genresList = Array.from(genresSet);
    genresList.sort();
    res.json(genresList);
  } catch (error) {
    console.error('Error fetching genres:', error);
    res.status(500).json({ error: 'Failed to fetch genres' });
  }
}

export async function getBookById(req, res) {
  try {
    const bookId = parseInt(req.params.id);
    
    const command = new GetItemCommand({
      TableName: BOOKS_TABLE_NAME,
      Key: { id: bookId }
    });
    
    const response = await dynamoDBDocClient.send(command);
    
    if (!response.Item) {
      return res.status(404).json({ error: 'Book not found' });
    }
    
    res.json(itemToBook(response.Item));
  } catch (error) {
    console.error('Error fetching book by ID:', error);
    res.status(500).json({ error: 'Failed to fetch book' });
  }
}
