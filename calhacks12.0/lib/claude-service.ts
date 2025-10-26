import { env } from "./env";

interface ClaudeMessage {
  role: "user" | "assistant";
  content: string;
}

interface ClaudeRequest {
  model: string;
  max_tokens: number;
  messages: ClaudeMessage[];
}

interface ClaudeResponse {
  content: Array<{
    text: string;
  }>;
  stop_reason: string;
}

interface CodeAnalysisData {
  patterns: {
    imports: string[];
    exports: string[];
    functions: Array<{
      name: string;
      file: string;
      line: number;
    }>;
    classes: Array<{
      name: string;
      file: string;
      line: number;
    }>;
    dependencies: string[];
    scripts: Record<string, string>;
  };
  metrics: {
    totalLines: number;
    averageFileSize: number;
    complexity: 'low' | 'medium' | 'high';
    testCoverage: number;
  };
  structure: {
    files: Array<{
      name: string;
      path: string;
      type: 'file' | 'dir';
      size?: number;
    }>;
    languages: Record<string, number>;
    readme?: string;
    packageJson?: any;
    totalFiles: number;
    importantFiles: Array<{
      name: string;
      path: string;
      type: 'file' | 'dir';
      size?: number;
    }>;
  };
}

export class ClaudeService {
  private apiKey: string;
  private baseUrl = "https://api.anthropic.com/v1/messages";

  constructor() {
    console.log('🔧 === CLAUDE SERVICE CONSTRUCTOR ===');
    console.log('🔧 Initializing Claude Service...');
    
    this.apiKey = env.CLAUDE_API_KEY || "";
    console.log('🔧 API Key loaded:', !!this.apiKey);
    console.log('🔧 API Key length:', this.apiKey.length);
    console.log('🔧 API Key starts with sk-ant:', this.apiKey.startsWith('sk-ant-'));
    console.log('🔧 API Key first 10 chars:', this.apiKey.substring(0, 10));
    console.log('🔧 Base URL:', this.baseUrl);
    
    if (!this.apiKey) {
      console.error('❌ Claude API key is missing!');
      throw new Error("Claude API key is required");
    }
    
    console.log('✅ Claude Service initialized successfully');
    console.log('🔧 === END CLAUDE SERVICE CONSTRUCTOR ===');
  }

  async analyzeCodebase(
    repoName: string,
    language: string | undefined,
    description: string | undefined,
    codeAnalysis: CodeAnalysisData
  ): Promise<{
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
  }> {
    console.log(`🤖 Claude Service: Starting analysis for ${repoName}`);
    console.log('📊 Code analysis data received:', {
      functions: codeAnalysis.patterns.functions.length,
      classes: codeAnalysis.patterns.classes.length,
      dependencies: codeAnalysis.patterns.dependencies.length,
      totalLines: codeAnalysis.metrics.totalLines
    });
    
    const prompt = this.buildAnalysisPrompt(repoName, language, description, codeAnalysis);
    console.log('📝 Claude prompt built, length:', prompt.length);
    
    try {
      console.log('🌐 Calling Claude API...');
      const response = await this.callClaudeAPI(prompt);
      console.log('✅ Claude API response received');
      console.log('📋 Response length:', response.content[0]?.text?.length || 0);
      
      const parsed = this.parseClaudeResponse(response);
      console.log('✅ Claude response parsed successfully');
      return parsed;
    } catch (error) {
      console.error("❌ Error calling Claude API:", error);
      throw new Error("Failed to get Claude AI analysis");
    }
  }

  private buildAnalysisPrompt(
    repoName: string,
    language: string | undefined,
    description: string | undefined,
    codeAnalysis: CodeAnalysisData
  ): string {
    const { patterns, metrics, structure } = codeAnalysis;

    return `You are an expert code reviewer and software architect. Analyze this codebase and provide detailed feedback.

REPOSITORY INFORMATION:
- Name: ${repoName}
- Primary Language: ${language || 'Unknown'}
- Description: ${description || 'No description provided'}

CODEBASE METRICS:
- Total Files: ${structure.totalFiles}
- Total Lines of Code: ${metrics.totalLines}
- Average File Size: ${metrics.averageFileSize.toFixed(1)} lines
- Complexity Level: ${metrics.complexity}
- Test Coverage: ${metrics.testCoverage.toFixed(1)}%
- Dependencies: ${patterns.dependencies.length} packages

CODE STRUCTURE:
- Functions: ${patterns.functions.length} total
- Classes: ${patterns.classes.length} total
- Imports: ${patterns.imports.length} total
- Exports: ${patterns.exports.length} total

LANGUAGES USED:
${Object.entries(structure.languages)
  .map(([lang, bytes]) => `- ${lang}: ${bytes} bytes`)
  .join('\n')}

KEY FILES:
${structure.importantFiles.slice(0, 10)
  .map(file => `- ${file.path} (${file.size || 0} bytes)`)
  .join('\n')}

FUNCTIONS FOUND:
${patterns.functions.slice(0, 15)
  .map(func => `- ${func.name} in ${func.file}:${func.line}`)
  .join('\n')}

CLASSES FOUND:
${patterns.classes.slice(0, 10)
  .map(cls => `- ${cls.name} in ${cls.file}:${cls.line}`)
  .join('\n')}

DEPENDENCIES:
${patterns.dependencies.slice(0, 20).join(', ')}

SCRIPTS AVAILABLE:
${Object.entries(patterns.scripts)
  .map(([name, script]) => `- ${name}: ${script}`)
  .join('\n')}

Please provide a comprehensive analysis in the following JSON format:

{
  "analysis": {
    "overallScore": <number between 0-100>,
    "strengths": ["<strength1>", "<strength2>", ...],
    "improvements": ["<improvement1>", "<improvement2>", ...],
    "securityIssues": ["<security1>", "<security2>", ...],
    "performanceIssues": ["<performance1>", "<performance2>", ...],
    "codeQuality": ["<quality1>", "<quality2>", ...],
    "recommendations": ["<recommendation1>", "<recommendation2>", ...]
  },
  "summary": "<detailed summary of the codebase analysis>"
}

Focus on:
1. Code organization and architecture
2. Best practices adherence
3. Security considerations
4. Performance optimization opportunities
5. Testing and maintainability
6. Modern development practices
7. Specific actionable recommendations

Be specific and provide concrete examples where possible.`;
  }

  private async callClaudeAPI(prompt: string): Promise<ClaudeResponse> {
    console.log('🌐 === CLAUDE API CALL START ===');
    console.log('🌐 Claude API: Preparing request...');
    
    const requestBody: ClaudeRequest = {
      model: "claude-3-sonnet-20240229",
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    };

    console.log('🌐 Request details:');
    console.log('🌐 - Model:', requestBody.model);
    console.log('🌐 - Max tokens:', requestBody.max_tokens);
    console.log('🌐 - Messages count:', requestBody.messages.length);
    console.log('🌐 - Prompt length:', prompt.length);
    console.log('🌐 - Prompt preview:', prompt.substring(0, 100) + '...');
    
    console.log('🌐 Headers:');
    console.log('🌐 - Authorization:', `Bearer ${this.apiKey.substring(0, 10)}...`);
    console.log('🌐 - Content-Type: application/json');
    console.log('🌐 - anthropic-version: 2023-06-01');
    
    console.log('🌐 Claude API: Sending request to Anthropic...');
    console.log('🌐 URL:', this.baseUrl);
    
    const startTime = Date.now();
    
    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify(requestBody)
      });

      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log('🌐 Claude API: Response received');
      console.log('🌐 - Status:', response.status);
      console.log('🌐 - Status Text:', response.statusText);
      console.log('🌐 - Duration:', duration + 'ms');
      console.log('🌐 - Headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        console.error('❌ Claude API error details:');
        console.error('❌ - Status:', response.status);
        console.error('❌ - Status Text:', response.statusText);
        
        const errorText = await response.text();
        console.error('❌ - Error body:', errorText);
        
        // Try to parse error as JSON for more details
        try {
          const errorJson = JSON.parse(errorText);
          console.error('❌ - Parsed error:', errorJson);
        } catch (e) {
          console.error('❌ - Error body is not JSON');
        }
        
        throw new Error(`Claude API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      console.log('✅ Claude API: Request successful, parsing response...');
      const responseData = await response.json();
      
      console.log('✅ Response data:');
      console.log('✅ - Content length:', responseData.content?.[0]?.text?.length || 0);
      console.log('✅ - Stop reason:', responseData.stop_reason);
      console.log('✅ - Response preview:', responseData.content?.[0]?.text?.substring(0, 100) + '...');
      
      console.log('🌐 === CLAUDE API CALL SUCCESS ===');
      return responseData;
      
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.error('❌ Claude API call failed:');
      console.error('❌ - Error:', error);
      console.error('❌ - Duration:', duration + 'ms');
      console.error('❌ - Error type:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('❌ - Error message:', error instanceof Error ? error.message : String(error));
      
      console.log('🌐 === CLAUDE API CALL FAILED ===');
      throw error;
    }
  }

  private parseClaudeResponse(response: ClaudeResponse): {
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
  } {
    try {
      const content = response.content[0]?.text;
      if (!content) {
        throw new Error("No content in Claude response");
      }

      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in Claude response");
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate the response structure
      if (!parsed.analysis || !parsed.summary) {
        throw new Error("Invalid response structure from Claude");
      }

      return {
        analysis: {
          overallScore: parsed.analysis.overallScore || 70,
          strengths: parsed.analysis.strengths || [],
          improvements: parsed.analysis.improvements || [],
          securityIssues: parsed.analysis.securityIssues || [],
          performanceIssues: parsed.analysis.performanceIssues || [],
          codeQuality: parsed.analysis.codeQuality || [],
          recommendations: parsed.analysis.recommendations || [],
        },
        summary: parsed.summary || "Analysis completed"
      };
    } catch (error) {
      console.error("Error parsing Claude response:", error);
      // Fallback to a basic response
      return {
        analysis: {
          overallScore: 70,
          strengths: ["Code analysis completed"],
          improvements: ["Consider reviewing the codebase structure"],
          securityIssues: [],
          performanceIssues: [],
          codeQuality: ["Code structure analyzed"],
          recommendations: ["Continue improving code quality"],
        },
        summary: "Claude AI analysis completed with some parsing issues. Please review the codebase manually for additional insights."
      };
    }
  }
}
