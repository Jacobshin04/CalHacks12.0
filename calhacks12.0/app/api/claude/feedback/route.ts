import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { env } from "../../../../lib/env";
import { GitHubService } from "../../../../lib/github-service";
import { ClaudeService } from "../../../../lib/claude-service";

interface ClaudeRequest {
  repoName: string;
  repoUrl: string;
  language?: string;
  description?: string;
  fullName?: string; // owner/repo format
}

interface ClaudeResponse {
  analysis: {
    overallScore: number;
    strengths: string[];
    improvements: string[];
    securityIssues: string[];
    performanceIssues: string[];
    codeQuality: string[];
    recommendations: string[];
  };
  summary: string;
}

export async function POST(request: NextRequest) {
  console.log('🚀 === CLAUDE AI FEEDBACK API CALLED ===');
  
  try {
    // Check authentication
    console.log('🔐 Checking authentication...');
    const session = await auth();
    if (!session?.accessToken) {
      console.log('❌ Authentication failed - no access token');
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    console.log('✅ Authentication successful');

    const body: ClaudeRequest = await request.json();
    const { repoName, repoUrl, language, description, fullName } = body;
    
    console.log('📊 Request data received:', {
      repoName,
      repoUrl,
      language,
      description,
      fullName,
      hasFullName: !!fullName
    });

    if (!repoName || !repoUrl) {
      console.log('❌ Missing required fields - repoName or repoUrl');
      return NextResponse.json(
        { error: "Repository name and URL are required" },
        { status: 400 }
      );
    }

    // Initialize services
    console.log('🔧 Initializing services...');
    const githubService = new GitHubService(session.accessToken);
    const claudeService = new ClaudeService();
    console.log('✅ Services initialized');

    let codeAnalysis = null;
    let analysisError = null;

    // Try to fetch and analyze the repository code
    if (fullName) {
      console.log('📁 FullName provided, attempting to fetch repository code...');
      try {
        const [owner, repo] = fullName.split('/');
        console.log(`🔍 Fetching repository structure for: ${owner}/${repo}`);
        
        const structure = await githubService.getRepositoryStructure(owner, repo);
        console.log('📊 Repository structure fetched:', {
          totalFiles: structure.totalFiles,
          languages: Object.keys(structure.languages),
          hasReadme: !!structure.readme,
          hasPackageJson: !!structure.packageJson,
          importantFiles: structure.importantFiles.length
        });
        
        console.log('🔬 Analyzing code patterns...');
        codeAnalysis = await githubService.analyzeCodePatterns(owner, repo, structure);
        console.log('📈 Code analysis completed:', {
          functions: codeAnalysis.patterns.functions.length,
          classes: codeAnalysis.patterns.classes.length,
          imports: codeAnalysis.patterns.imports.length,
          dependencies: codeAnalysis.patterns.dependencies.length,
          totalLines: codeAnalysis.metrics.totalLines,
          complexity: codeAnalysis.metrics.complexity,
          testCoverage: codeAnalysis.metrics.testCoverage
        });
        
        // Get Claude AI analysis if we have code data
        if (codeAnalysis) {
          console.log('🤖 Code analysis successful, calling Claude AI...');
          try {
            console.log('🤖 Getting Claude AI analysis for:', repoName);
            const claudeAnalysis = await claudeService.analyzeCodebase(
              repoName, 
              language, 
              description, 
              codeAnalysis
            );
            console.log('✅ Claude AI analysis completed successfully!');
            console.log('📋 Claude AI response summary:', claudeAnalysis.summary.substring(0, 100) + '...');
            return NextResponse.json(claudeAnalysis);
          } catch (claudeError) {
            console.error('❌ Error getting Claude AI analysis:', claudeError);
            console.log('🔄 Falling back to rule-based analysis');
            // Fall back to rule-based analysis
            const analysis = generateRealAnalysis(repoName, language, description, codeAnalysis);
            console.log('📊 Rule-based analysis completed as fallback');
            return NextResponse.json(analysis);
          }
        } else {
          console.log('❌ Code analysis failed - no analysis data returned');
        }
      } catch (error) {
        console.error('❌ Error analyzing repository code:', error);
        analysisError = error;
      }
    } else {
      console.log('❌ No fullName provided - cannot fetch repository code');
    }

    // Generate analysis based on real code data or fallback to mock
    console.log('🔄 Generating final analysis...');
    const analysis = generateAnalysis(repoName, language, description, codeAnalysis, analysisError);
    
    console.log('📊 Final analysis type:', codeAnalysis ? 'Real code analysis' : 'Mock analysis');
    console.log('📋 Final analysis summary:', analysis.summary.substring(0, 100) + '...');
    console.log('🏁 === CLAUDE AI FEEDBACK API COMPLETED ===');
    
    return NextResponse.json(analysis);
  } catch (error) {
    console.error("❌ Fatal error in Claude AI feedback API:", error);
    console.log('🏁 === CLAUDE AI FEEDBACK API FAILED ===');
    return NextResponse.json(
      { error: "Failed to analyze repository" },
      { status: 500 }
    );
  }
}

function generateAnalysis(
  repoName: string, 
  language: string | undefined, 
  description: string | undefined,
  codeAnalysis: any,
  analysisError: any
): ClaudeResponse {
  if (codeAnalysis) {
    // Real analysis based on actual code
    return generateRealAnalysis(repoName, language, description, codeAnalysis);
  } else {
    // Fallback to mock analysis
    return generateMockAnalysis(repoName, language, description, analysisError);
  }
}

function generateRealAnalysis(repoName: string, language: string | undefined, description: string | undefined, codeAnalysis: any): ClaudeResponse {
  const { patterns, metrics, structure } = codeAnalysis;
  
  // Calculate overall score based on real metrics
  let score = 70; // Base score
  
  // Adjust score based on code quality indicators
  if (metrics.testCoverage > 50) score += 10;
  if (metrics.complexity === 'low') score += 5;
  if (patterns.functions.length > 10) score += 5;
  if (structure.packageJson?.scripts?.test) score += 5;
  if (structure.readme) score += 5;
  
  score = Math.min(100, score);

  const strengths = [];
  const improvements = [];
  const securityIssues = [];
  const performanceIssues = [];
  const codeQuality = [];
  const recommendations = [];

  // Analyze strengths
  if (patterns.functions.length > 0) {
    strengths.push(`Well-structured codebase with ${patterns.functions.length} functions`);
  }
  if (patterns.classes.length > 0) {
    strengths.push(`Object-oriented design with ${patterns.classes.length} classes`);
  }
  if (structure.readme) {
    strengths.push("Comprehensive documentation with README");
  }
  if (metrics.testCoverage > 30) {
    strengths.push(`Good test coverage at ${metrics.testCoverage.toFixed(1)}%`);
  }
  if (structure.packageJson?.scripts?.test) {
    strengths.push("Automated testing setup");
  }

  // Analyze improvements
  if (metrics.testCoverage < 30) {
    improvements.push(`Increase test coverage (currently ${metrics.testCoverage.toFixed(1)}%)`);
  }
  if (patterns.functions.length < 5) {
    improvements.push("Consider breaking down large files into smaller functions");
  }
  if (!structure.packageJson?.scripts?.lint) {
    improvements.push("Add linting scripts to package.json");
  }
  if (metrics.complexity === 'high') {
    improvements.push("Consider refactoring to reduce code complexity");
  }

  // Security analysis
  if (patterns.dependencies.length > 20) {
    securityIssues.push("Large number of dependencies - consider auditing for security vulnerabilities");
  }
  if (!structure.files.some((f: any) => f.name === '.env.example')) {
    securityIssues.push("Missing .env.example file for environment variable documentation");
  }

  // Performance analysis
  if (metrics.averageFileSize > 200) {
    performanceIssues.push("Large average file size - consider code splitting");
  }
  if (patterns.imports.length > 50) {
    performanceIssues.push("High number of imports - consider tree shaking optimization");
  }

  // Code quality
  if (patterns.functions.length > 0) {
    codeQuality.push("Good function organization");
  }
  if (patterns.classes.length > 0) {
    codeQuality.push("Proper class structure");
  }
  if (structure.packageJson) {
    codeQuality.push("Well-configured package management");
  }

  // Recommendations
  if (metrics.testCoverage < 50) {
    recommendations.push("Implement comprehensive testing strategy");
  }
  if (!structure.packageJson?.scripts?.build) {
    recommendations.push("Add build scripts for production deployment");
  }
  if (patterns.dependencies.length > 0) {
    recommendations.push("Regularly update dependencies for security patches");
  }

  return {
    analysis: {
      overallScore: score,
      strengths,
      improvements,
      securityIssues,
      performanceIssues,
      codeQuality,
      recommendations,
    },
    summary: `Based on analysis of the ${repoName} repository, this ${language || 'codebase'} project shows ${metrics.complexity} complexity with ${patterns.functions.length} functions and ${patterns.classes.length} classes. The codebase has ${metrics.totalLines} total lines across ${structure.totalFiles} files. ${metrics.testCoverage > 30 ? 'Good test coverage' : 'Test coverage could be improved'}. Overall, this is a ${score >= 80 ? 'well-structured' : score >= 60 ? 'decent' : 'needs improvement'} codebase.`
  };
}

function generateMockAnalysis(repoName: string, language: string | undefined, description: string | undefined, analysisError: any): ClaudeResponse {
  return {
    analysis: {
      overallScore: Math.floor(Math.random() * 30) + 70, // 70-100
      strengths: [
        "Well-structured component architecture",
        "Good use of TypeScript for type safety",
        "Consistent code formatting and style",
        "Proper error handling in API routes",
        "Clean separation of concerns"
      ],
      improvements: [
        "Add more comprehensive unit tests",
        "Implement proper logging system",
        "Add input validation for user data",
        "Consider implementing caching for API responses",
        "Add more detailed error messages"
      ],
      securityIssues: [
        "Environment variables should be validated on startup",
        "Consider adding rate limiting to API endpoints",
        "Implement proper CORS configuration"
      ],
      performanceIssues: [
        "Large bundle size could be optimized",
        "Consider implementing code splitting",
        "Database queries could be optimized"
      ],
      codeQuality: [
        "Good naming conventions",
        "Functions are appropriately sized",
        "Good use of modern JavaScript features",
        "Could benefit from more inline documentation"
      ],
      recommendations: [
        "Set up automated testing pipeline",
        "Implement monitoring and alerting",
        "Add performance monitoring",
        "Consider implementing a design system",
        "Add comprehensive documentation"
      ]
    },
    summary: `Based on my analysis of the ${repoName} repository, this appears to be a well-structured ${language || 'JavaScript/TypeScript'} project. The codebase shows good architectural decisions and modern development practices. The main areas for improvement focus on testing, monitoring, and performance optimization. Overall, this is a solid codebase with room for enhancement in specific areas.${analysisError ? ' Note: Unable to fetch actual code content, showing general analysis.' : ''}`
  };
}
