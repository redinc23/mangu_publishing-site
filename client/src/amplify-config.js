export default {
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID,
      identityPoolId: import.meta.env.VITE_IDENTITY_POOL_ID,
      loginWith: {
        username: true,
        email: true,
        phone: false
      },
      region: import.meta.env.VITE_AWS_REGION || 'us-east-1'
    }
  }
};
