// server/src/services/cognito.js
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  InitiateAuthCommand,
  GlobalSignOutCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  ConfirmSignUpCommand,
  ResendConfirmationCodeCommand,
  GetUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import crypto from 'crypto';

const region = process.env.AWS_REGION || process.env.COGNITO_REGION || 'us-east-1';
const userPoolId = process.env.COGNITO_USER_POOL_ID;
const clientId = process.env.COGNITO_CLIENT_ID || process.env.COGNITO_APP_CLIENT_ID;
const clientSecret = process.env.COGNITO_CLIENT_SECRET;

if (!userPoolId || !clientId) {
  console.warn('[Cognito Service] Missing required environment variables: COGNITO_USER_POOL_ID, COGNITO_CLIENT_ID');
}

const client = new CognitoIdentityProviderClient({ region });

/**
 * Calculate SECRET_HASH if client secret is configured
 */
function calculateSecretHash(username) {
  if (!clientSecret) return undefined;
  const message = username + clientId;
  return crypto
    .createHmac('sha256', clientSecret)
    .update(message)
    .digest('base64');
}

/**
 * Sign up a new user
 */
export async function signUp({ email, password, name }) {
  try {
    const params = {
      ClientId: clientId,
      Username: email,
      Password: password,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'name', Value: name || email },
      ],
    };

    if (clientSecret) {
      params.SecretHash = calculateSecretHash(email);
    }

    const command = new SignUpCommand(params);
    const response = await client.send(command);

    console.log('[Cognito] User signed up:', email);

    return {
      success: true,
      userSub: response.UserSub,
      userConfirmed: response.UserConfirmed,
      codeDeliveryDetails: response.CodeDeliveryDetails,
    };
  } catch (error) {
    console.error('[Cognito] Sign up error:', error.message);
    return {
      success: false,
      error: error.message,
      code: error.name,
    };
  }
}

/**
 * Sign in a user (returns tokens)
 */
export async function signIn({ email, password }) {
  try {
    const params = {
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: clientId,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    };

    if (clientSecret) {
      params.AuthParameters.SECRET_HASH = calculateSecretHash(email);
    }

    const command = new InitiateAuthCommand(params);
    const response = await client.send(command);

    if (response.ChallengeName) {
      return {
        success: false,
        challenge: response.ChallengeName,
        session: response.Session,
        challengeParameters: response.ChallengeParameters,
      };
    }

    console.log('[Cognito] User signed in:', email);

    return {
      success: true,
      tokens: {
        accessToken: response.AuthenticationResult.AccessToken,
        idToken: response.AuthenticationResult.IdToken,
        refreshToken: response.AuthenticationResult.RefreshToken,
        expiresIn: response.AuthenticationResult.ExpiresIn,
        tokenType: response.AuthenticationResult.TokenType,
      },
    };
  } catch (error) {
    console.error('[Cognito] Sign in error:', error.message);
    return {
      success: false,
      error: error.message,
      code: error.name,
    };
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshToken({ refreshToken, username }) {
  try {
    const params = {
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      ClientId: clientId,
      AuthParameters: {
        REFRESH_TOKEN: refreshToken,
      },
    };

    if (clientSecret && username) {
      params.AuthParameters.SECRET_HASH = calculateSecretHash(username);
    }

    const command = new InitiateAuthCommand(params);
    const response = await client.send(command);

    console.log('[Cognito] Token refreshed for user');

    return {
      success: true,
      tokens: {
        accessToken: response.AuthenticationResult.AccessToken,
        idToken: response.AuthenticationResult.IdToken,
        expiresIn: response.AuthenticationResult.ExpiresIn,
        tokenType: response.AuthenticationResult.TokenType,
      },
    };
  } catch (error) {
    console.error('[Cognito] Refresh token error:', error.message);
    return {
      success: false,
      error: error.message,
      code: error.name,
    };
  }
}

/**
 * Global sign out (invalidates all tokens)
 */
export async function signOut({ accessToken }) {
  try {
    const command = new GlobalSignOutCommand({
      AccessToken: accessToken,
    });

    await client.send(command);

    console.log('[Cognito] User signed out globally');

    return {
      success: true,
    };
  } catch (error) {
    console.error('[Cognito] Sign out error:', error.message);
    return {
      success: false,
      error: error.message,
      code: error.name,
    };
  }
}

/**
 * Initiate forgot password flow
 */
export async function forgotPassword({ email }) {
  try {
    const params = {
      ClientId: clientId,
      Username: email,
    };

    if (clientSecret) {
      params.SecretHash = calculateSecretHash(email);
    }

    const command = new ForgotPasswordCommand(params);
    const response = await client.send(command);

    console.log('[Cognito] Password reset initiated for:', email);

    return {
      success: true,
      codeDeliveryDetails: response.CodeDeliveryDetails,
    };
  } catch (error) {
    console.error('[Cognito] Forgot password error:', error.message);
    return {
      success: false,
      error: error.message,
      code: error.name,
    };
  }
}

/**
 * Confirm forgot password with code
 */
export async function confirmForgotPassword({ email, code, newPassword }) {
  try {
    const params = {
      ClientId: clientId,
      Username: email,
      ConfirmationCode: code,
      Password: newPassword,
    };

    if (clientSecret) {
      params.SecretHash = calculateSecretHash(email);
    }

    const command = new ConfirmForgotPasswordCommand(params);
    await client.send(command);

    console.log('[Cognito] Password reset confirmed for:', email);

    return {
      success: true,
    };
  } catch (error) {
    console.error('[Cognito] Confirm password error:', error.message);
    return {
      success: false,
      error: error.message,
      code: error.name,
    };
  }
}

/**
 * Confirm sign up with verification code
 */
export async function confirmSignUp({ email, code }) {
  try {
    const params = {
      ClientId: clientId,
      Username: email,
      ConfirmationCode: code,
    };

    if (clientSecret) {
      params.SecretHash = calculateSecretHash(email);
    }

    const command = new ConfirmSignUpCommand(params);
    await client.send(command);

    console.log('[Cognito] Email confirmed for:', email);

    return {
      success: true,
    };
  } catch (error) {
    console.error('[Cognito] Confirm sign up error:', error.message);
    return {
      success: false,
      error: error.message,
      code: error.name,
    };
  }
}

/**
 * Resend confirmation code
 */
export async function resendConfirmationCode({ email }) {
  try {
    const params = {
      ClientId: clientId,
      Username: email,
    };

    if (clientSecret) {
      params.SecretHash = calculateSecretHash(email);
    }

    const command = new ResendConfirmationCodeCommand(params);
    const response = await client.send(command);

    console.log('[Cognito] Confirmation code resent to:', email);

    return {
      success: true,
      codeDeliveryDetails: response.CodeDeliveryDetails,
    };
  } catch (error) {
    console.error('[Cognito] Resend code error:', error.message);
    return {
      success: false,
      error: error.message,
      code: error.name,
    };
  }
}

/**
 * Get current user details from access token
 */
export async function getCurrentUser({ accessToken }) {
  try {
    const command = new GetUserCommand({
      AccessToken: accessToken,
    });

    const response = await client.send(command);

    const attributes = {};
    response.UserAttributes.forEach((attr) => {
      attributes[attr.Name] = attr.Value;
    });

    return {
      success: true,
      user: {
        username: response.Username,
        attributes,
        email: attributes.email,
        emailVerified: attributes.email_verified === 'true',
        name: attributes.name,
        sub: attributes.sub,
      },
    };
  } catch (error) {
    console.error('[Cognito] Get user error:', error.message);
    return {
      success: false,
      error: error.message,
      code: error.name,
    };
  }
}

/**
 * Map Cognito errors to user-friendly messages
 */
export function getUserFriendlyError(error) {
  const errorMap = {
    UserNotFoundException: 'No account found with this email address',
    NotAuthorizedException: 'Incorrect email or password',
    UsernameExistsException: 'An account with this email already exists',
    InvalidPasswordException: 'Password does not meet requirements (min 8 characters, uppercase, lowercase, number)',
    CodeMismatchException: 'Invalid verification code',
    ExpiredCodeException: 'Verification code has expired. Please request a new one',
    LimitExceededException: 'Too many attempts. Please try again later',
    TooManyRequestsException: 'Too many requests. Please try again later',
    InvalidParameterException: 'Invalid request parameters',
    UserNotConfirmedException: 'Please verify your email address before signing in',
  };

  return errorMap[error] || 'An unexpected error occurred. Please try again';
}
