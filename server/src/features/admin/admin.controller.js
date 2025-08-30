import dynamoDBLib from "@aws-sdk/lib-dynamodb";
const { ScanCommand, PutItemCommand, UpdateItemCommand, DeleteItemCommand } = dynamoDBLib;
import { dynamoDBDocClient } from "../../config/dynamoDB.js";
import { BOOKS_TABLE_NAME, itemToBook, bookToItem } from "../../models/BookModel.js";

// Get all books for admin
export async function getAdminBooks(req, res) {
  try {
    const command = new ScanCommand({
      TableName: BOOKS_TABLE_NAME,
    });
    
    const response = await dynamoDBDocClient.send(command);
    const books = response.Items.map(itemToBook);
    res.json(books);
  } catch (error) {
    console.error('Error fetching admin books:', error);
    res.status(500).json({ error: 'Failed to fetch books' });
  }
}

// Create a new book
export async function createBook(req, res) {
  try {
    const { title, author, genre, year, rating, cover, description } = req.body;
    
    // Generate a new ID (you might want to use a better ID generation strategy)
    const newId = Date.now();
    
    const newBook = {
      id: newId,
      title,
      author,
      genre,
      year: parseInt(year),
      rating: rating ? parseFloat(rating) : null,
      cover,
      description
    };
    
    const command = new PutItemCommand({
      TableName: BOOKS_TABLE_NAME,
      Item: bookToItem(newBook)
    });
    
    await dynamoDBDocClient.send(command);
    res.status(201).json(newBook);
  } catch (error) {
    console.error('Error creating book:', error);
    res.status(500).json({ error: 'Failed to create book' });
  }
}

// Update a book
export async function updateBook(req, res) {
  try {
    const bookId = parseInt(req.params.id);
    const updates = req.body;
    
    // Prepare update expression
    const updateExpressions = [];
    const expressionAttributeValues = {};
    const expressionAttributeNames = {};
    
    Object.keys(updates).forEach((key, index) => {
      if (key !== 'id') { // Don't update the ID
        const attributeName = `#attr${index}`;
        const attributeValue = `:val${index}`;
        
        expressionAttributeNames[attributeName] = key;
        expressionAttributeValues[attributeValue] = updates[key];
        updateExpressions.push(`${attributeName} = ${attributeValue}`);
      }
    });
    
    if (updateExpressions.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    const command = new UpdateItemCommand({
      TableName: BOOKS_TABLE_NAME,
      Key: { id: bookId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    });
    
    const response = await dynamoDBDocClient.send(command);
    res.json(itemToBook(response.Attributes));
  } catch (error) {
    console.error('Error updating book:', error);
    res.status(500).json({ error: 'Failed to update book' });
  }
}

// Delete a book
export async function deleteBook(req, res) {
  try {
    const bookId = parseInt(req.params.id);
    
    const command = new DeleteItemCommand({
      TableName: BOOKS_TABLE_NAME,
      Key: { id: bookId }
    });
    
    await dynamoDBDocClient.send(command);
    res.status(204).send(); // No content
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({ error: 'Failed to delete book' });
  }
}