import { NextRequest, NextResponse } from "next/server";
import { ClaudeService } from "../../../lib/claude-service";

export async function POST(request: NextRequest) {
  console.log('🧪 === TEST CLAUDE API ENDPOINT ===');
  
  try {
    console.log('🔧 Creating Claude Service instance...');
    const claudeService = new ClaudeService();
    console.log('✅ Claude Service created successfully');

    // Test with a simple analysis
    const testData = {
      patterns: {
        imports: ['react', 'next'],
        exports: ['Component'],
        functions: [{ name: 'testFunction', file: 'test.js', line: 10 }],
        classes: [{ name: 'TestClass', file: 'test.js', line: 5 }],
        dependencies: ['react', 'next'],
        scripts: { test: 'jest' }
      },
      metrics: {
        totalLines: 100,
        averageFileSize: 50,
        complexity: 'low' as const,
        testCoverage: 80
      },
      structure: {
        files: [{ name: 'test.js', path: 'test.js', type: 'file' as const, size: 1000 }],
        languages: { JavaScript: 100 },
        readme: 'Test README',
        packageJson: { name: 'test', version: '1.0.0' },
        totalFiles: 1,
        importantFiles: [{ name: 'test.js', path: 'test.js', type: 'file' as const, size: 1000 }]
      }
    };

    console.log('📝 Test data prepared:', {
      functions: testData.patterns.functions.length,
      classes: testData.patterns.classes.length,
      totalLines: testData.metrics.totalLines
    });

    console.log('🤖 Testing Claude API with code analysis...');
    const response = await claudeService.analyzeCodebase(
      'test-repo',
      'JavaScript',
      'A test repository',
      testData
    );
    
    console.log('✅ Claude API test successful!');
    console.log('📋 Response summary:', response.summary.substring(0, 100) + '...');

    return NextResponse.json({
      success: true,
      message: "Claude API test successful",
      response: {
        summary: response.summary,
        overallScore: response.analysis.overallScore,
        strengthsCount: response.analysis.strengths.length
      }
    });

  } catch (error) {
    console.error('❌ Claude API test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: "Claude API test failed"
    }, { status: 500 });
  }
}
