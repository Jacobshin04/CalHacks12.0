import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { GitHubService } from "../../../../lib/github-service";

export async function POST(request: NextRequest) {
  console.log('🧪 === TEST REPO FETCH API CALLED ===');
  
  try {
    // Check authentication
    console.log('🔐 Checking authentication...');
    const session = await auth();
    if (!session?.accessToken) {
      console.log('❌ No access token found');
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    console.log('✅ Authentication successful');

    const body = await request.json();
    const { fullName } = body;
    
    console.log('📊 Test request data:', { fullName });

    if (!fullName) {
      console.log('❌ No fullName provided');
      return NextResponse.json({ error: "fullName is required" }, { status: 400 });
    }

    const [owner, repo] = fullName.split('/');
    console.log(`🔍 Testing repository fetch for: ${owner}/${repo}`);

    // Initialize GitHub service
    const githubService = new GitHubService(session.accessToken);
    
    // Test repository structure fetching
    console.log('📁 Testing getRepositoryStructure...');
    const structure = await githubService.getRepositoryStructure(owner, repo);
    
    console.log('📊 Repository structure result:', {
      totalFiles: structure.totalFiles,
      languages: Object.keys(structure.languages),
      hasReadme: !!structure.readme,
      hasPackageJson: !!structure.packageJson,
      importantFiles: structure.importantFiles.length,
      sampleFiles: structure.importantFiles.slice(0, 5).map(f => f.path)
    });

    // Test code pattern analysis
    console.log('🔬 Testing analyzeCodePatterns...');
    const codeAnalysis = await githubService.analyzeCodePatterns(owner, repo, structure);
    
    console.log('📈 Code analysis result:', {
      functions: codeAnalysis.patterns.functions.length,
      classes: codeAnalysis.patterns.classes.length,
      imports: codeAnalysis.patterns.imports.length,
      dependencies: codeAnalysis.patterns.dependencies.length,
      totalLines: codeAnalysis.metrics.totalLines,
      complexity: codeAnalysis.metrics.complexity,
      testCoverage: codeAnalysis.metrics.testCoverage
    });

    console.log('✅ Repository fetch test completed successfully!');
    console.log('🏁 === TEST REPO FETCH API COMPLETED ===');

    return NextResponse.json({
      success: true,
      message: "Repository fetch test completed successfully",
      data: {
        structure: {
          totalFiles: structure.totalFiles,
          languages: Object.keys(structure.languages),
          hasReadme: !!structure.readme,
          hasPackageJson: !!structure.packageJson,
          importantFiles: structure.importantFiles.length
        },
        analysis: {
          functions: codeAnalysis.patterns.functions.length,
          classes: codeAnalysis.patterns.classes.length,
          imports: codeAnalysis.patterns.imports.length,
          dependencies: codeAnalysis.patterns.dependencies.length,
          totalLines: codeAnalysis.metrics.totalLines,
          complexity: codeAnalysis.metrics.complexity,
          testCoverage: codeAnalysis.metrics.testCoverage
        }
      }
    });

  } catch (error) {
    console.error('❌ Test repository fetch failed:', error);
    console.log('🏁 === TEST REPO FETCH API FAILED ===');
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: "Repository fetch test failed"
    }, { status: 500 });
  }
}
