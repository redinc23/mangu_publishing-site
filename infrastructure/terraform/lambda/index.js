const { CloudFrontClient, CreateInvalidationCommand } = require('@aws-sdk/client-cloudfront');

const cloudfront = new CloudFrontClient({ region: 'us-east-1' });

exports.handler = async (event) => {
    console.log('Event:', JSON.stringify(event, null, 2));
    
    const distributionId = process.env.DISTRIBUTION_ID;
    const environment = process.env.ENVIRONMENT;
    
    if (!distributionId) {
        throw new Error('DISTRIBUTION_ID environment variable not set');
    }
    
    // Parse SNS message
    let paths = ['/*'];
    let invalidationType = 'full';
    
    if (event.Records && event.Records[0].Sns) {
        try {
            const message = JSON.parse(event.Records[0].Sns.Message);
            paths = message.paths || paths;
            invalidationType = message.type || invalidationType;
        } catch (e) {
            console.warn('Failed to parse SNS message, using default invalidation');
        }
    }
    
    console.log(`Creating invalidation for distribution ${distributionId}`);
    console.log(`Paths: ${JSON.stringify(paths)}`);
    console.log(`Type: ${invalidationType}`);
    
    const params = {
        DistributionId: distributionId,
        InvalidationBatch: {
            CallerReference: `${Date.now()}-${environment}`,
            Paths: {
                Quantity: paths.length,
                Items: paths
            }
        }
    };
    
    try {
        const command = new CreateInvalidationCommand(params);
        const response = await cloudfront.send(command);
        
        console.log('Invalidation created:', response.Invalidation.Id);
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Cache invalidation created successfully',
                invalidationId: response.Invalidation.Id,
                distributionId: distributionId,
                paths: paths
            })
        };
    } catch (error) {
        console.error('Error creating invalidation:', error);
        throw error;
    }
};
