import AWS from 'aws-sdk';

const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider({
  region: process.env.AWS_REGION || 'us-east-1'
});

export const COGNITO_CONFIG = {
  UserPoolId: process.env.COGNITO_USER_POOL_ID,
  ClientId: process.env.COGNITO_CLIENT_ID,
  region: process.env.AWS_REGION || 'us-east-1'
};

export const verifyToken = async (token) => {
  try {
    const params = { AccessToken: token };
    const result = await cognitoIdentityServiceProvider.getUser(params).promise();
    return {
      success: true,
      user: {
        id: result.Username,
        email: result.UserAttributes.find(attr => attr.Name === 'email')?.Value,
        name: result.UserAttributes.find(attr => attr.Name === 'name')?.Value,
        groups: result.UserAttributes.find(attr => attr.Name === 'cognito:groups')?.Value?.split(',') || []
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};