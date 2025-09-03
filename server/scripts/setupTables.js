import AWS from "@aws-sdk/client-dynamodb";
const { DynamoDBClient, CreateTableCommand, DescribeTableCommand } = AWS;

const dynamoDBClient = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const tables = [
  {
    TableName: 'mangu-users',
    KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'email', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [{
      IndexName: 'EmailIndex',
      KeySchema: [{ AttributeName: 'email', KeyType: 'HASH' }],
      Projection: { ProjectionType: 'ALL' },
      BillingMode: 'PAY_PER_REQUEST'
    }],
    BillingMode: 'PAY_PER_REQUEST'
  },
  {
    TableName: 'mangu-user-library',
    KeySchema: [
      { AttributeName: 'userId', KeyType: 'HASH' },
      { AttributeName: 'bookId', KeyType: 'RANGE' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'userId', AttributeType: 'S' },
      { AttributeName: 'bookId', AttributeType: 'N' }
    ],
    BillingMode: 'PAY_PER_REQUEST'
  },
  {
    TableName: 'mangu-user-cart',
    KeySchema: [
      { AttributeName: 'userId', KeyType: 'HASH' },
      { AttributeName: 'bookId', KeyType: 'RANGE' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'userId', AttributeType: 'S' },
      { AttributeName: 'bookId', AttributeType: 'N' }
    ],
    BillingMode: 'PAY_PER_REQUEST'
  },
  {
    TableName: 'mangu-reviews',
    KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'bookId', AttributeType: 'N' }
    ],
    GlobalSecondaryIndexes: [{
      IndexName: 'BookReviewsIndex',
      KeySchema: [{ AttributeName: 'bookId', KeyType: 'HASH' }],
      Projection: { ProjectionType: 'ALL' },
      BillingMode: 'PAY_PER_REQUEST'
    }],
    BillingMode: 'PAY_PER_REQUEST'
  },
  {
    TableName: 'mangu-payments',
    KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'userId', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [{
      IndexName: 'UserPaymentsIndex',
      KeySchema: [{ AttributeName: 'userId', KeyType: 'HASH' }],
      Projection: { ProjectionType: 'ALL' },
      BillingMode: 'PAY_PER_REQUEST'
    }],
    BillingMode: 'PAY_PER_REQUEST'
  }
];

async function createTable(tableConfig) {
  try {
    try {
      await dynamoDBClient.send(new DescribeTableCommand({ 
        TableName: tableConfig.TableName 
      }));
      console.log(`✅ Table ${tableConfig.TableName} already exists`);
      return;
    } catch (error) {
      if (error.name !== 'ResourceNotFoundException') throw error;
    }

    await dynamoDBClient.send(new CreateTableCommand(tableConfig));
    console.log(`✅ Created table: ${tableConfig.TableName}`);
  } catch (error) {
    console.error(`❌ Error creating table ${tableConfig.TableName}:`, error);
    throw error;
  }
}

async function setupAllTables() {
  console.log('🚀 Setting up DynamoDB tables...');
  
  try {
    for (const table of tables) {
      await createTable(table);
    }
    console.log('✅ All tables created successfully!');
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  setupAllTables();
}

export default setupAllTables;