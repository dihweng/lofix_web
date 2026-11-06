export const getFriendlyErrorMessage = (
  err: any,
  fallbackMessage = 'An unexpected error occurred. Please try again.'
): string => {
  if (!err) return fallbackMessage;

  const status = err.response?.status;
  const serverMessage = err.response?.data?.message || err.message;

  // If server provided a clean descriptive message, use it (excluding raw technical Axios strings)
  if (
    serverMessage &&
    !serverMessage.includes('Request failed with status code') &&
    !serverMessage.includes('Network Error')
  ) {
    if (serverMessage === 'Email or password is incorrect') {
      return 'Email or password is incorrect, or your account requires verification.';
    }
    return serverMessage;
  }

  // Map by HTTP status code
  switch (status) {
    case 400:
      return 'Invalid request. Please check your input and try again.';
    case 401:
      return 'Your session has expired or you are not signed in. Please sign in to continue.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested resource or page could not be found.';
    case 409:
      return 'This action conflicts with an existing record or state.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
    case 502:
    case 503:
    case 504:
      return 'Our servers are experiencing temporary issues. Please try again shortly.';
    default:
      if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        return 'Network connection error. Please check your internet connection.';
      }
      return serverMessage && !serverMessage.includes('status code')
        ? serverMessage
        : fallbackMessage;
  }
};
