module.exports = {
    ci: {
        collect: {
            staticDistDir: './',
            url: ['http://localhost/index.html'],
            numberOfRuns: 3,
        },
        upload: {
            target: 'temporary-public-storage',
        },
        assert: {
            preset: 'lighthouse:recommended',
            assertions: {
                'categories:performance': ['warn', { minScore: 0.9 }],
                'categories:accessibility': ['error', { minScore: 0.9 }],
            },
        },
    },
};
