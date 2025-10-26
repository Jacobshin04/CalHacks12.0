// Simple test to verify Claude API integration
const { ClaudeService } = require('./lib/claude-service.ts');

async function testClaudeService() {
  try {
    console.log('Testing Claude Service...');
    
    // Mock code analysis data
    const mockCodeAnalysis = {
      patterns: {
        imports: ['react', 'next', 'typescript'],
        exports: ['Dashboard', 'AuthProvider'],
        functions: [
          { name: 'analyzeRepository', file: 'dashboard.tsx', line: 90 },
          { name: 'fetchRepos', file: 'api.ts', line: 15 }
        ],
        classes: [
          { name: 'GitHubService', file: 'github-service.ts', line: 48 }
        ],
        dependencies: ['react', 'next', 'typescript', 'tailwindcss'],
        scripts: {
          'dev': 'next dev',
          'build': 'next build',
          'test': 'jest'
        }
      },
      metrics: {
        totalLines: 1250,
        averageFileSize: 85.5,
        complexity: 'medium',
        testCoverage: 45.2
      },
      structure: {
        files: [
          { name: 'package.json', path: 'package.json', type: 'file', size: 1024 },
          { name: 'README.md', path: 'README.md', type: 'file', size: 2048 }
        ],
        languages: { 'TypeScript': 85000, 'JavaScript': 12000 },
        readme: '# My Awesome Project\nA Next.js application with TypeScript',
        packageJson: { name: 'my-project', scripts: { test: 'jest' } },
        totalFiles: 25,
        importantFiles: [
          { name: 'package.json', path: 'package.json', type: 'file', size: 1024 }
        ]
      }
    };

    const claudeService = new ClaudeService();
    const result = await claudeService.analyzeCodebase(
      'test-repo',
      'TypeScript',
      'A test repository',
      mockCodeAnalysis
    );
    
    console.log('Claude AI Analysis Result:');
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Error testing Claude service:', error);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  testClaudeService();
}
