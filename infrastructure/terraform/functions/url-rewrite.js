function handler(event) {
    var request = event.request;
    var uri = request.uri;
    
    // Check if URI has a file extension
    if (!uri.includes('.') && !uri.endsWith('/')) {
        request.uri = '/index.html';
    }
    
    return request;
}
