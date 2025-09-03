// client/src/config/aws.js
import { Amplify } from 'aws-amplify';

export function configureAmplify() {
  Amplify.configure({
    Auth: {
      Cognito: {
        region: import.meta.env.VITE_AWS_REGION,
        userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
        userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
        loginWith: {
          oauth: {
            domain: import.meta.env.VITE_COGNITO_DOMAIN, // e.g. us-east-1p75auzssk.auth.us-east-1.amazoncognito.com
            scopes: ['openid', 'email', 'profile'],
            redirectSignIn: [import.meta.env.VITE_REDIRECT_SIGN_IN],
            redirectSignOut: [import.meta.env.VITE_REDIRECT_SIGN_OUT],
            responseType: 'code', // Authorization Code Grant with PKCE
          },
        },
      },
    },
  });
}
